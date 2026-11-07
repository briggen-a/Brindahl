#include <stdio.h>
#include <string.h>
#include "esp_event.h"
#include "esp_http_server.h"
#include "esp_intr_alloc.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "usb/usb_host.h"
#include "usb/msc_host.h"
#include "usb/msc_host_vfs.h"

httpd_handle_t start_server(const char *key);
static QueueHandle_t events;
static const char *tag = "brindahl";

static void usb_events(void *arg) {
    while (true) {
        uint32_t flags;
        if (usb_host_lib_handle_events(portMAX_DELAY, &flags) == ESP_OK &&
            (flags & USB_HOST_LIB_EVENT_FLAGS_NO_CLIENTS)) usb_host_device_free_all();
    }
}

static void drive_event(const msc_host_event_t *event, void *arg) {
    xQueueSend(events, event, portMAX_DELAY);
}

static bool read_keys(char *password, char *key) {
    FILE *file = fopen("/usb/party.cfg", "r");
    if (!file) return false;
    int fields = fscanf(file, "wifi=%32[0-9a-f]\nhost=%64[^\r\n]", password, key);
    fclose(file);
    return fields == 2 && strlen(password) == 16 && strlen(key) >= 12 && strlen(key) <= 64;
}

void app_main(void) {
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_ap();
    wifi_init_config_t init = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&init));
    ESP_ERROR_CHECK(esp_wifi_set_storage(WIFI_STORAGE_RAM));
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    events = xQueueCreate(8, sizeof(msc_host_event_t));
    ESP_ERROR_CHECK(events ? ESP_OK : ESP_ERR_NO_MEM);
    usb_host_config_t usb = {.intr_flags = ESP_INTR_FLAG_LEVEL1};
    ESP_ERROR_CHECK(usb_host_install(&usb));
    ESP_ERROR_CHECK(xTaskCreate(usb_events, "usb-events", 4096, NULL, 5, NULL) == pdPASS ? ESP_OK : ESP_ERR_NO_MEM);
    msc_host_driver_config_t driver = {.create_backround_task=true, .task_priority=5,
        .stack_size=4096, .core_id=tskNO_AFFINITY, .callback=drive_event};
    ESP_ERROR_CHECK(msc_host_install(&driver));
    msc_host_device_handle_t drive = NULL;
    msc_host_vfs_handle_t mount = NULL;
    httpd_handle_t server = NULL;
    bool wifi = false;
    for (;;) {
        msc_host_event_t event;
        xQueueReceive(events, &event, portMAX_DELAY);
        if (event.event == MSC_DEVICE_CONNECTED && !drive) {
            esp_vfs_fat_mount_config_t config = {.format_if_mount_failed=false, .max_files=8};
            if (msc_host_install_device(event.device.address, &drive) != ESP_OK) continue;
            if (msc_host_vfs_register(drive, "/usb", &config, &mount) != ESP_OK) {
                ESP_LOGE(tag, "Could not mount the FAT drive");
                continue;
            }
            char password[33] = "", key[65] = "";
            if (!read_keys(password, key)) { ESP_LOGE(tag, "Check party.cfg on the drive"); continue; }
            wifi_config_t ap = {.ap={.ssid="BRINDAHL_IMPERIAL_NETWORK", .channel=1,
                .max_connection=10, .authmode=WIFI_AUTH_WPA2_PSK}};
            strcpy((char *)ap.ap.password, password);
            if (esp_wifi_set_config(WIFI_IF_AP, &ap) != ESP_OK || esp_wifi_start() != ESP_OK) continue;
            wifi = true;
            server = start_server(key);
            if (server) ESP_LOGI(tag, "Guestbook ready at http://192.168.4.1");
            else ESP_LOGE(tag, "Guestbook server failed to start");
        } else if (event.event == MSC_DEVICE_DISCONNECTED && drive && event.device.handle == drive) {
            if (server) { httpd_stop(server); server = NULL; }
            if (wifi) { esp_wifi_stop(); wifi = false; }
            if (mount) { msc_host_vfs_unregister(mount); mount = NULL; }
            msc_host_uninstall_device(drive);
            drive = NULL;
        }
    }
}

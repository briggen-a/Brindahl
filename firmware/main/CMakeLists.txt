idf_component_register(SRCS "main.c" "server.c" "book.c" INCLUDE_DIRS "."
    REQUIRES esp_wifi esp_event esp_netif esp_http_server nvs_flash fatfs usb json mbedtls)

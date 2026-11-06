#include "book.h"
#include "esp_http_server.h"
#include <ctype.h>
#include <stdlib.h>
#include <string.h>

#define REGISTRY "/usb/registry"
static char host_key[65];

static esp_err_t reply(httpd_req_t *req, int status) {
    const char *label = "500 Internal Server Error";
    switch (status) {
        case 200: label = "200 OK"; break;
        case 201: label = "201 Created"; break;
        case 400: label = "400 Bad Request"; break;
        case 403: label = "403 Forbidden"; break;
        case 404: label = "404 Not Found"; break;
        case 413: label = "413 Content Too Large"; break;
        case 503: label = "503 Service Unavailable"; break;
        case 507: label = "507 Insufficient Storage"; break;
    }
    httpd_resp_set_status(req, label);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, status < 300 ? "{}" : "{\"error\":true}");
    // Close failed requests, including any unread body.
    return status < 300 ? ESP_OK : ESP_FAIL;
}

static esp_err_t sign_entry(httpd_req_t *req) {
    char type[40];
    if (httpd_req_get_hdr_value_str(req, "Content-Type", type, sizeof(type)) != ESP_OK ||
        strcmp(type, "application/json")) return reply(req, 400);
    size_t size = req->content_len;
    if (!size || size > 120000) return reply(req, 413);
    char *body = malloc(size+1);
    if (!body) return reply(req, 503);
    size_t offset = 0;
    while (offset < size) {
        int got = httpd_req_recv(req, body+offset, size-offset);
        if (got <= 0) { free(body); return ESP_FAIL; }
        offset += got;
    }
    body[size] = 0;
    cJSON *entry = cJSON_ParseWithOpts(body, NULL, true);
    free(body);
    int status = entry ? book_add(REGISTRY, entry) : 400;
    cJSON_Delete(entry);
    return reply(req, status);
}

static esp_err_t delete_entry(httpd_req_t *req) {
    char key[65];
    if (httpd_req_get_hdr_value_str(req, "X-Host-Key", key, sizeof(key)) != ESP_OK ||
        strlen(key) != 64) return reply(req, 403);
    unsigned int difference = 0;
    for (int i=0; i<64; ++i) difference |= key[i] ^ host_key[i];
    if (difference) return reply(req, 403);
    return reply(req, book_delete(REGISTRY, req->uri + strlen("/api/entries/")));
}

static esp_err_t list_entries(httpd_req_t *req) {
    char query[64], value[8];
    int limit = 12;
    if (httpd_req_get_url_query_str(req, query, sizeof(query)) == ESP_OK &&
        httpd_query_key_value(query, "limit", value, sizeof(value)) == ESP_OK)
        limit = atoi(value);
    if (limit < 1 || limit > BOOK_CAPACITY) return reply(req, 400);
    cJSON *list = book_list(REGISTRY, limit);
    char *json = list ? cJSON_PrintUnformatted(list) : NULL;
    cJSON_Delete(list);
    if (!json) return reply(req, 503);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-store");
    esp_err_t result = httpd_resp_sendstr(req, json);
    cJSON_free(json);
    return result;
}

static esp_err_t send_file(httpd_req_t *req, FILE *file, const char *type) {
    if (!file) return reply(req, 404);
    char buf[2048];
    httpd_resp_set_type(req, type);
    httpd_resp_set_hdr(req, "X-Content-Type-Options", "nosniff");
    size_t n;
    esp_err_t result = ESP_OK;
    while ((n = fread(buf, 1, sizeof(buf), file)) != 0) {
        result = httpd_resp_send_chunk(req, buf, n);
        if (result != ESP_OK) break;
    }
    if (ferror(file)) result = ESP_FAIL;
    fclose(file);
    return result == ESP_OK ? httpd_resp_send_chunk(req, NULL, 0) : result;
}

static esp_err_t serve_photo(httpd_req_t *req) {
    httpd_resp_set_hdr(req, "Cache-Control", "no-store");
    return send_file(req, book_photo(REGISTRY, req->uri + strlen("/api/photos/")), "image/jpeg");
}

static esp_err_t serve_site(httpd_req_t *req) {
    char path[192];
    const char *uri = !strcmp(req->uri, "/") ? "/index.html" : req->uri;
    if (strstr(uri, "..") || strspn(uri, "/.-_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") != strlen(uri) ||
        snprintf(path, sizeof(path), "/usb/site%s", uri) >= sizeof(path)) return reply(req, 404);
    const char *ext = strrchr(uri, '.');
    static const struct { const char *ext, *mime; } types[] = {
        {".html","text/html"}, {".css","text/css"}, {".js","text/javascript"},
        {".png","image/png"}, {".webp","image/webp"}, {".woff","font/woff"}, {".woff2","font/woff2"}
    };
    for (size_t i=0; ext && i<sizeof(types)/sizeof(types[0]); ++i)
        if (!strcmp(ext, types[i].ext)) return send_file(req, fopen(path, "rb"), types[i].mime);
    return reply(req, 404);
}

httpd_handle_t start_server(const char *key) {
    memcpy(host_key, key, sizeof(host_key));
    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.uri_match_fn = httpd_uri_match_wildcard;
    config.stack_size = 12288;
    config.lru_purge_enable = true;
    if (httpd_start(&server, &config) != ESP_OK) return NULL;
    const httpd_uri_t routes[] = {
        {.uri="/api/entries", .method=HTTP_GET, .handler=list_entries},
        {.uri="/api/entries", .method=HTTP_POST, .handler=sign_entry},
        {.uri="/api/entries/*", .method=HTTP_DELETE, .handler=delete_entry},
        {.uri="/api/photos/*", .method=HTTP_GET, .handler=serve_photo},
        {.uri="/*", .method=HTTP_GET, .handler=serve_site},
    };
    for (size_t i=0; i<sizeof(routes)/sizeof(routes[0]); ++i) {
        if (httpd_register_uri_handler(server, &routes[i]) != ESP_OK) {
            httpd_stop(server);
            return NULL;
        }
    }
    return server;
}

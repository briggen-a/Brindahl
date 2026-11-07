// Each signature is one record: a JSON metadata line followed by optional JPEG bytes.
// The server serializes operations. Only a closed, renamed record is made visible.
#include "book.h"
#include "mbedtls/base64.h"
#include <dirent.h>
#include <errno.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

bool valid_id(const char *id) {
    return id && strlen(id) == 32 && strspn(id, "0123456789abcdef") == 32;
}

static const char *field(const cJSON *object, const char *name) {
    return cJSON_GetStringValue(cJSON_GetObjectItemCaseSensitive(object, name));
}

static bool record_path(char *path, size_t capacity, const char *dir, const char *id) {
    return valid_id(id) && snprintf(path, capacity, "%s/%s", dir, id) < (int)capacity;
}

static int record_count(const char *dir) {
    DIR *folder = opendir(dir);
    if (!folder) return -1;
    int count = 0;
    struct dirent *file;
    while ((file = readdir(folder))) if (valid_id(file->d_name)) ++count;
    closedir(folder);
    return count;
}

int book_add(const char *dir, const cJSON *entry) {
    const char *id = field(entry, "id"), *name = field(entry, "name");
    const char *message = field(entry, "message"), *photo = field(entry, "photo");
    double created = cJSON_GetNumberValue(cJSON_GetObjectItemCaseSensitive(entry, "created"));
    char path[192], pending[200];
    if (!record_path(path, sizeof(path), dir, id) || !name || !*name ||
        strspn(name, " \t\r\n") == strlen(name) || strlen(name) > 256 ||
        !message || strlen(message) > 1600 || !photo || strlen(photo) > 4*((PHOTO_LIMIT+2)/3) ||
        !isfinite(created) || created < 1 || created > 8640000000000000.0) return 400;

    FILE *existing = fopen(path, "rb");
    if (existing) { fclose(existing); return 200; } // Retry after lost acknowledgement.
    int count = record_count(dir);
    if (count < 0 || count >= BOOK_CAPACITY) return 507;
    size_t bytes = 0;
    unsigned char *jpeg = NULL;
    if (*photo) {
        jpeg = malloc(PHOTO_LIMIT);
        if (!jpeg) return 503;
        if (mbedtls_base64_decode(jpeg, PHOTO_LIMIT, &bytes, (const unsigned char *)photo, strlen(photo)) ||
            bytes < 5 || memcmp(jpeg, "\xff\xd8\xff", 3) || jpeg[bytes-2] != 0xff || jpeg[bytes-1] != 0xd9) {
            free(jpeg);
            return 400;
        }
    }
    char url[64] = "";
    if (bytes) snprintf(url, sizeof(url), "/api/photos/%s", id);
    cJSON *meta = cJSON_CreateObject();
    char *line = NULL;
    if (meta && cJSON_AddStringToObject(meta, "id", id) && cJSON_AddStringToObject(meta, "name", name) &&
        cJSON_AddStringToObject(meta, "message", message) && cJSON_AddNumberToObject(meta, "created", created) &&
        cJSON_AddStringToObject(meta, "photo", url)) line = cJSON_PrintUnformatted(meta);
    cJSON_Delete(meta);
    snprintf(pending, sizeof(pending), "%s.tmp", path);
    FILE *out = line ? fopen(pending, "wb") : NULL;
    bool saved = out && fprintf(out, "%s\n", line) > 0 && (!bytes || fwrite(jpeg, 1, bytes, out) == bytes);
    if (out && fclose(out)) saved = false;
    free(jpeg);
    cJSON_free(line);
    if (saved && rename(pending, path) == 0) return 201;
    unlink(pending);
    return 507;
}

int book_delete(const char *dir, const char *id) {
    char path[192];
    if (!record_path(path, sizeof(path), dir, id)) return 400;
    if (unlink(path) == 0 || errno == ENOENT) return 200;
    return 503;
}

// The writer escapes line breaks and bounds metadata to under 12 KB.
static cJSON *read_meta(FILE *file) {
    char *line = malloc(12288);
    cJSON *meta = NULL;
    if (line && fgets(line, 12288, file) && strchr(line, '\n')) meta = cJSON_Parse(line);
    free(line);
    return meta;
}

FILE *book_photo(const char *dir, const char *id) {
    char path[192];
    if (!record_path(path, sizeof(path), dir, id)) return NULL;
    FILE *file = fopen(path, "rb");
    if (!file) return NULL;
    cJSON *meta = read_meta(file);
    const char *photo = field(meta, "photo");
    bool found = photo && *photo;
    cJSON_Delete(meta);
    if (!found) { fclose(file); return NULL; }
    return file;
}

static int newest(const void *a, const void *b) {
    const cJSON *left = *(cJSON *const *)a, *right = *(cJSON *const *)b;
    double x = cJSON_GetNumberValue(cJSON_GetObjectItem(left, "created"));
    double y = cJSON_GetNumberValue(cJSON_GetObjectItem(right, "created"));
    return x < y ? 1 : x > y ? -1 : 0;
}

cJSON *book_list(const char *dir, int limit) {
    DIR *folder = opendir(dir);
    if (!folder) return NULL;
    cJSON *rows[BOOK_CAPACITY];
    int count = 0;
    struct dirent *entry;
    while (count < BOOK_CAPACITY && (entry = readdir(folder))) {
        char path[192];
        if (!record_path(path, sizeof(path), dir, entry->d_name)) continue;
        FILE *file = fopen(path, "rb");
        if (!file) continue;
        cJSON *meta = read_meta(file);
        fclose(file);
        if (meta) rows[count++] = meta;
    }
    closedir(folder);
    qsort(rows, count, sizeof(rows[0]), newest);
    cJSON *list = cJSON_CreateArray();
    for (int i = 0; i < count; ++i)
        if (!list || i >= limit || !cJSON_AddItemToArray(list, rows[i])) cJSON_Delete(rows[i]);
    return list;
}

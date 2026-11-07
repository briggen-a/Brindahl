#pragma once
#include <stdbool.h>
#include <stdio.h>
#include "cJSON.h"

#define BOOK_CAPACITY 200
#define PHOTO_LIMIT (80 * 1024)
bool valid_id(const char *id);
int book_add(const char *dir, const cJSON *entry);
int book_delete(const char *dir, const char *id);
FILE *book_photo(const char *dir, const char *id);
cJSON *book_list(const char *dir, int limit);

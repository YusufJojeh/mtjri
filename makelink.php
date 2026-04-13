<?php
$target = __DIR__ . '/storage/app/public';
$link   = __DIR__ . '/public/storage';

if (file_exists($link) || is_link($link)) {
    echo "Link already exists";
    exit;
}

if (@symlink($target, $link)) {
    echo "Symlink created successfully!";
} else {
    echo "Failed: ";
    var_dump(error_get_last());
}

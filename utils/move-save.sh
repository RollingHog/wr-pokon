#!/bin/bash

# source file path
SOURCE="/home/floppa/Загрузки/data.json.js"
# destination dir
DESTINATION='/home/floppa/Рабочий стол/myprojects/wr-pokon'
INTERVAL=4

while true; do
    # Check if the source file exists before moving
    if [ -e "$SOURCE" ]; then
        mv "$SOURCE" "$DESTINATION"
        echo "Moved file at $(date)"
    fi
    
    sleep "$INTERVAL"
done

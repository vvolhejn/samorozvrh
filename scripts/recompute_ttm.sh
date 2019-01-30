#!/bin/bash
# Recompute the transfer time matrix and put it in the cache if successful
# Assumes the file maps_api_key contains a Google Maps API key
DIR=$(dirname "$0")
cd $DIR
python3 get_transfer_time_matrix.py $(cat maps_api_key) > /tmp/ttm.json

if [[ $? == 0 ]]; then
    cp /tmp/ttm.json ../cache/transfer_time_matrix.json
    echo "Updated transfer_time_matrix.json"
else
    echo "Error while updating transfer_time_matrix.json"
    exit 1
fi

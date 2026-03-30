#!/bin/bash

# ---------change the hostname
# get the token (if IMDSv2)
# check the IMDSv1 first
isV1 = $(curl http://169.254.169.254/ | wc -c)
if [[ -z isV1 ]]; then
    TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
fi

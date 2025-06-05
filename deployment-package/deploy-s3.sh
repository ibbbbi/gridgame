#!/bin/bash
echo "☁️ Deploying to AWS S3..."
echo "1. Install AWS CLI: pip install awscli"
echo "2. Configure AWS: aws configure"
echo "3. Create bucket: aws s3 mb s3://your-bucket-name"
echo "4. Enable static hosting: aws s3 website s3://your-bucket-name --index-document index.html"
echo "5. Upload files: aws s3 sync . s3://your-bucket-name --delete"
echo "6. Set public read: aws s3api put-bucket-policy --bucket your-bucket-name --policy file://s3-policy.json"

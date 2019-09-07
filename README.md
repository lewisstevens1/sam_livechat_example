sam package \
    --template-file template.yaml \
    --output-template-file packaged.yaml \
    --s3-bucket revive-chat-bucket \
    --profile=ls

sam deploy \
    --template-file packaged.yaml \
    --stack-name ReviveChat \
    --capabilities CAPABILITY_IAM \
    --profile=ls

aws cloudformation describe-stacks \
    --stack-name ReviveChat --query 'Stacks[].Outputs' \
    --profile=ls

{"message":"sendmessage", "data":"hello world"}

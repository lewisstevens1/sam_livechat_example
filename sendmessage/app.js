const AWS = require('aws-sdk'),
    ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' }),
    { TABLE_NAME } = process.env;

exports.handler = async (event, context) => {
    let connectionData;

    try {
        connectionData = await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connection_id' }).promise();
    } catch (e) {
        return { statusCode: 500, body: e.stack };
    }

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const postData = JSON.parse(event.body).data;

    const postCalls = connectionData.Items.map(async ({ connection_id }) => {
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connection_id, Data: postData }).promise();
        } catch (e) {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connection_id}`);
                await ddb.delete({ TableName: TABLE_NAME, Key: { connection_id } }).promise();
            } else {
                throw e;
            }
        }
    });

    try {
        await Promise.all(postCalls);
    } catch (e) {
        return { statusCode: 500, body: e.stack };
    }

    return { statusCode: 200, body: 'Data sent.' };
};

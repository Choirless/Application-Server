const debug = require('debug')('bin:lib:storage');
const AWS = require('aws-sdk');

AWS.config.update({
    endpoint : process.env.COS_ENDPOINT,
    accessKeyId: process.env.COS_ACCESS_KEY_ID,
    secretAccessKey: process.env.COS_ACCESS_KEY_SECRET,
    region: process.env.COS_REGION || 'eu-geo'
});

const S3 = new AWS.S3();

function checkObjectIsInS3(key, bucket = process.env.COS_DEFAULT_BUCKET){

	return new Promise( (resolve, reject) => {

		S3.headObject({
			Bucket : bucket,
			Key : key
		}, (err, data) => {

			if(err && err.code === 'NotFound'){
				resolve(false);
			} else if(err){
				reject(err);
			} else {
				resolve(data);
			}

		});

	} );

}

function getObjectFromS3(key, bucket = process.env.COS_DEFAULT_BUCKET){
	
	return new Promise( (resolve, reject) => {

		S3.getObject({
			Bucket : bucket,
			Key : key		
		}, (err, data) => {

			if(err){
				reject(err);
			} else {
				resolve(data);
			}

		});

	} );

}

function getObjectWithStreamFromS3(key, bucket = process.env.COS_DEFAULT_BUCKET){
	
	return S3.getObject({
		Bucket : bucket,
		Key : key		
	}).createReadStream();

}

function putObjectInS3Bucket(key, data, bucket = process.env.COS_DEFAULT_BUCKET){
	
	return new Promise( (resolve, reject) => {

		S3.putObject({
			Bucket : bucket,
			Key : key,
            Body : data
		}, err => {

			if(err){
				reject(err);
			} else{
				resolve();
			}

		});

	} );

}

function listObjectsInS3Bucket(bucket = process.env.COS_DEFAULT_BUCKET){
    return new Promise( (resolve, reject) => {
        
        S3.listObjects({
            Bucket : bucket
        }, (err, data) => { 

            if(err){
                reject(err);
            } else {
                resolve(data);
            }

        });

    });
}

function deleteAnObjectFromAnS3Bucket(key, bucket = process.env.COS_DEFAULT_BUCKET){

	return new Promise( (resolve, reject) => {

		S3.deleteObject({
			Bucket: bucket,
			Key: key
		}, function(err, data) {

			if(err){
				debug('Delete object err:', err);
				reject(err);
			} else {
				resolve();
			}

		});

	});

}

function deleteManyObjectsFromAnS3Bucket(keys, bucket = process.env.COS_DEFAULT_BUCKET){
	
	if(keys.length === 0){
		return Promise.resolve();
	} else {

		return new Promise( (resolve, reject) => {
	
			S3.deleteObjects({
				Bucket: bucket,
				Delete: {
					Objects: keys
				}
			}, function(err, data) {
	
				if(err){
					debug('Delete object(s) err:', err);
					reject(err);
				} else {
					resolve();
				}
	
			});
	
		});

	}


}

module.exports = {
	check : checkObjectIsInS3,
	get : getObjectFromS3,
	getStream : getObjectWithStreamFromS3,
    put : putObjectInS3Bucket,
	list : listObjectsInS3Bucket,
	delete : deleteAnObjectFromAnS3Bucket,
	deleteMany : deleteManyObjectsFromAnS3Bucket
}
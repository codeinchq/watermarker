# watermarker

[![Code Inc.](https://img.shields.io/badge/Code%20Inc.-Document%20Cloud-blue)](https://www.codeinc.co)
[![Docker Image CI](https://github.com/codeinchq/watermarker/actions/workflows/docker-image.yml/badge.svg)](https://github.com/codeinchq/watermarker/actions/workflows/docker-image.yml)
[![Docker Image Version](https://img.shields.io/docker/v/codeinchq/watermarker?sort=semver&label=Docker%20Hub&color=red)](https://hub.docker.com/r/codeinchq/pdf2txt/tags)


This repository contains a simple containerized REST API to apply a watermark to an image. The server is written in Javascript and uses the [Jimp](https://www.npmjs.com/package/jimp) library to process the images.

The image is available on [Docker Hub](https://hub.docker.com/r/codeinchq/watermarker) under the name `codeinchq/watermarker`.

## Configuration

By default, the container listens on port 3000. The port is configurable using the `PORT` environment variable.

## Usage

All requests must by send in POST to the `/apply` endpoint with a `multipart/form-data` content type. The request must
contain two files:
* `image`: The image to apply the watermark to.
* `watermark`: The watermark to apply to the image.

Additional parameters can be sent to customize the conversion process:
* `size`: The size of the watermark in relation to the image in percentage. The value must be an integer. The default value is 75.
* `position`: The position of the watermark. The value must be one of `center`, `top-left`, `top`, `top-right`, `left`, `right`, `bottom-left`, `bottom`, `bottom-right`. The default value is `center`.
* `padding`: The padding between the watermark and the edge of the image. The value must be an integer. The default value is 10. This is ignored if the position is `center`.
* `format`: The format of the output image. The value must be one of `jpg`, `png`, `gif`. The default value is `png`.
* `quality`: The quality of the output image. The value must be an integer between 0 and 100. The default value is 100. This is ignored if the format is `gif` or `png`.
* `blur`: The blur radius of background behind the watermark. The value must be an integer. The default value is 0.
* `opacity`: The opacity of the watermark. The value must be an integer between 0 and 100. The default value is 100.

The server returns `200` if the conversion was successful and the images are available in the response body. In case of
error, the server returns a `400` status code with a JSON object containing the error message (
format: `{error: string}`).

### Example

#### Step 1: run the container using Docker

```bash
docker run -p "3000:3000" codeinchq/watermarker 
```

#### Step 2: apply the watermark to an image

A simple scenario to apply a watermark to an image using `curl`:
```bash
curl -X POST http://localhost:3000/apply -F "image=@/path/to/image.png" -F "watermark=@/path/to/watermark.png" -o watermarked.png
```

A more complex scenario with additional parameters:
```bash
curl -X POST http://localhost:3000/apply -F "image=@/path/to/image.png" -F "watermark=@/path/to/watermark.png" -F "blur=3" -F "size=100" -F "format=jpg" -F "quality=100" -o test-watermarked.jpg
```

### Health check

A health check is available at the `/health` endpoint. The server returns a status code of `200` if the service is healthy, along with a JSON object:
```json
{ "status": "up" }
```

## Client

A PHP 8 client is available at on [GitHub](https://github.com/codeinchq/document-cloud-php-client) and [Packagist](https://packagist.org/packages/codeinc/document-cloud-client).

## License

This project is licensed under the MIT License - see
the [LICENSE](https://github.com/codeinchq/watermarker?tab=MIT-1-ov-file) file for details.

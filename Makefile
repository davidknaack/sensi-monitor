.PHONY: docker-build docker-run

docker-build:
	docker build -t sensi-monitor .	

docker-run:
	docker run --env-file env_settings sensi-monitor

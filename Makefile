.PHONY: help prepare-dev test lint run
.DEFAULT_GOAL := help

# Load all the environment variables from .env
export $(cat .env | xargs)

define BROWSER_PYSCRIPT
import webbrowser, sys

webbrowser.open(sys.argv[1])
endef
export BROWSER_PYSCRIPT

BROWSER := python3 -c "$$BROWSER_PYSCRIPT"

define PRINT_HELP_PYSCRIPT
import re, sys

for line in sys.stdin:
	match = re.match(r'^([/a-zA-Z_-]+):.*?## (.*)$$', line)
	if match:
		target, help = match.groups()
		print("%-30s %s" % (target, help))
endef
export PRINT_HELP_PYSCRIPT

APP_ROOT ?= $(shell 'pwd')

export GIT_COMMIT ?= $(shell git rev-parse HEAD)
export GIT_BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)


export ENV_PATH ?= $(APP_ROOT)/.env
export ENVIRONMENT_OVERRIDE_PATH ?= $(APP_ROOT)/env/Makefile.override.dev
export OVERLAY_PATH ?= k8s/overlays/$(STAGE)
export DOCKER_BUILD_FLAGS ?= --no-cache
export DOCKER_BUILD_PATH ?= $(APP_ROOT)
export DOCKER_FILE ?= $(APP_ROOT)/Dockerfile.k8s
export SOURCE_IMAGE ?= stride-learning-api-server
export TARGET_IMAGE ?= $(REGISTRY_URL)/$(ECR_REPO_NAME)
export TARGET_IMAGE_LATEST ?= $(TARGET_IMAGE):$(SOURCE_IMAGE)-$(GIT_BRANCH)-$(GIT_COMMIT)
-include $(ENVIRONMENT_OVERRIDE_PATH)


define kustomize-image-edit
	cd $(OVERLAY_PATH) && kustomize edit set image saas-orange-api=$(1) && cd $(APP_ROOT)
endef


docker-build: ## build docker file
	@docker build $(DOCKER_BUILD_FLAGS) --platform=linux/amd64 -t $(SOURCE_IMAGE) -f $(DOCKER_FILE) $(DOCKER_BUILD_PATH)

docker-tag: ## docker tag
	echo $(REGISTRY_URL)
	echo $(AWS_REGION)
	echo $(TARGET_IMAGE_LATEST)
	@docker tag $(SOURCE_IMAGE) $(TARGET_IMAGE_LATEST)

docker-push: ## docker push
	@docker push $(TARGET_IMAGE_LATEST)

docker-login: ## Login to ECR registry
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(REGISTRY_URL)

update-kubeconfig: ## Update kube config
	@aws eks update-kubeconfig --name=$(EKS_CLUSTER_NAME) --region=$(AWS_REGION)

edit-kustomize: ## copy env file and create kustomization.yaml
	@cp $(OVERLAY_PATH)/kustomization.template.yaml $(OVERLAY_PATH)/kustomization.yaml

edit-image-name: edit-kustomize ## edit image name in kustomize
	@$(call kustomize-image-edit,$(TARGET_IMAGE_LATEST))

apply: edit-image-name ## Kubectl apply using kustomize
	@kustomize build $(OVERLAY_PATH) | kubectl apply -f -

deploy: docker-build docker-tag docker-login docker-push update-kubeconfig apply

edit-kustomize-for-feature:
	@cp $(OVERLAY_PATH)/kustomization.template.yaml $(OVERLAY_PATH)/kustomization.yaml
	@cp $(ENV_PATH) $(OVERLAY_PATH)/.env
	@cd $(OVERLAY_PATH) && kustomize edit add configmap stride-api-configmap --from-env-file .env
	@cd $(OVERLAY_PATH) && kustomize edit set namespace $(GIT_BRANCH)-stride
	@cd $(OVERLAY_PATH) && kustomize edit set nameprefix $(GIT_BRANCH)-
	@cd $(OVERLAY_PATH) && kustomize edit remove label app
	@cd $(OVERLAY_PATH) && kustomize edit remove label release
	@cd $(OVERLAY_PATH) && kustomize edit add label app:$(GIT_BRANCH)-stride-api,release:$(GIT_BRANCH)
	@cd $(OVERLAY_PATH) && kustomize edit set image saas-stride-api=$(TARGET_IMAGE_LATEST)

apply-feature: edit-kustomize-for-feature  ## edit image name, nameprefix, labels inkustomize
	@kustomize build $(OVERLAY_PATH) | kubectl apply -f -

deploy-feature: docker-build docker-tag docker-login docker-push update-kubeconfig apply-feature

deploy-feature-ingress: update-kubeconfig
	@INGRESS_NAME=$(INGRESS_NAME) gomplate -f k8s/templates/ingress.template.yaml | kubectl apply -f -

clean: ## Remove log file.
	@rm -rf logs/**.log logs/**.json build
	@rm -f $(OVERLAY_PATH)/.env
	@rm -f $(OVERLAY_PATH)/kustomization.yaml

show-env: ## Show environment variables
	@cat $(ENVIRONMENT_OVERRIDE_PATH)\
	  | grep -v '^$$' \
	  | xargs -d "\n" -I "{}" bash -c "cut -d ' ' -f 2 < <(echo '{}')" \
	  | xargs -d "\n" -I "{}" -n 1 bash -c "printf "{}="; printenv {}"

help:
	@python3 -c "$$PRINT_HELP_PYSCRIPT" < $(MAKEFILE_LIST)

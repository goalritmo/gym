.PHONY: build run test clean deps

# Variables
BINARY_NAME=gym-api
GO_FILES=$(shell find . -name "*.go" -type f)

# Construir el binario
build:
	go build -o $(BINARY_NAME) .

# Ejecutar el servidor
run:
	go run main.go

# Ejecutar tests
test:
	go test -v ./...

# Ejecutar tests con coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generado en coverage.html"

# Instalar dependencias
deps:
	go mod tidy
	go mod download

# Limpiar archivos generados
clean:
	go clean
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html

# Verificar formato del código
fmt:
	go fmt ./...

# Ejecutar linter
lint:
	golangci-lint run

# Hot reload para desarrollo (requiere air)
dev:
	air

# Instalar air para hot reload
install-air:
	go install github.com/cosmtrek/air@latest

# Help
help:
	@echo "Comandos disponibles:"
	@echo "  build          - Construir el binario"
	@echo "  run            - Ejecutar el servidor"
	@echo "  test           - Ejecutar tests"
	@echo "  test-coverage  - Ejecutar tests con coverage"
	@echo "  deps           - Instalar dependencias"
	@echo "  clean          - Limpiar archivos generados"
	@echo "  fmt            - Formatear código"
	@echo "  lint           - Ejecutar linter"
	@echo "  dev            - Hot reload (requiere air)"
	@echo "  install-air    - Instalar air para desarrollo"

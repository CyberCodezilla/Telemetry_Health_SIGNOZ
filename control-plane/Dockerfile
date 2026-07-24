FROM golang:alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o api-server ./cmd/api-server
RUN go build -o mcp-server ./cmd/mcp-server

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/api-server .
COPY --from=builder /app/mcp-server .
COPY docs /app/docs

EXPOSE 8080 8081 4317 9090 9091
CMD ["./api-server"]

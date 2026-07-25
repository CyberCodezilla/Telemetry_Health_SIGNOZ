FROM golang:alpine AS builder
ENV GOTOOLCHAIN=auto
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o api-server ./cmd/api-server
RUN CGO_ENABLED=0 go build -o mcp-server ./cmd/mcp-server
RUN CGO_ENABLED=0 go build -o ingest-gateway ./cmd/ingest-gateway
RUN CGO_ENABLED=0 go build -o worker ./cmd/worker

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/api-server .
COPY --from=builder /app/mcp-server .
COPY --from=builder /app/ingest-gateway .
COPY --from=builder /app/worker .
COPY docs /app/docs

EXPOSE 8080 8081 4317 9090 9091
CMD ["./api-server"]

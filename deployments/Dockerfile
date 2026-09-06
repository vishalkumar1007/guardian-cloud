# Multi-stage build for Guardian Cloud API
# Build context: guardian-cloud/ (repo root of this module)

FROM golang:1.24-bookworm AS build
WORKDIR /src
ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -trimpath -ldflags="-s -w" -o /out/guardian-server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/guardian-server /app/guardian-server
EXPOSE 8083
USER nonroot:nonroot
ENTRYPOINT ["/app/guardian-server"]

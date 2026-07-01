from enum import Enum


class NodeType(str, Enum):
    SERVICE = "service"
    DATABASE = "database"
    CACHE = "cache"
    QUEUE = "queue"
    EXTERNAL = "external"
    INFRASTRUCTURE = "infrastructure"


class CommunicationMode(str, Enum):
    SYNC_REQUEST_RESPONSE = "sync_request_response"
    ASYNC_MESSAGE = "async_message"
    ONE_WAY_NOTIFICATION = "one_way_notification"
    PUBLISH_SUBSCRIBE = "publish_subscribe"
    EVENT_BROADCAST = "event_broadcast"


class Protocol(str, Enum):
    HTTP_REST = "http_rest"
    GRPC = "grpc"
    GRAPHQL = "graphql"
    WEBSOCKET = "websocket"
    AMQP = "amqp"
    KAFKA = "kafka"
    DATABASE = "database"
    CUSTOM = "custom"

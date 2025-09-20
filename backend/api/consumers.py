from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class StreamConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.stream_id = self.scope['url_route']['kwargs']['stream_id']
        self.group_name = f'stream_{self.stream_id}'

        # Simple auth check (optional): allow anonymous connect for viewing
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Echo/ping or future control messages
        cmd = content.get('type')
        if cmd == 'ping':
            await self.send_json({'type': 'pong'})

    async def stream_update(self, event):
        # Forward analysis updates to clients
        await self.send_json(event.get('data', {}))


class AlertConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group_name = 'alerts'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def alert_message(self, event):
        await self.send_json(event.get('data', {}) )

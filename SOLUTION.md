# Solution

## Key design

- Real-time system, payment dashboard are updated as soon as event is emitted from server side
- Websocket connection that send single payment updates to client

## Trade-offs
- Task requires to use websocket/long polling that could use for both server and client connection. Since this only requires dashboard/monitoring update on client side, a simple server-sent event (SSE) should works more efficient.
- This solution requires DB persistence successfully before sending event to achieve data consistency, so there might be some delays if DB update is slow due to many reasons. (Consistency-availability trade-offs)


## Long term implementation
- This implementation is only demo for single user. To achieve better scale, applies a more powerful streaming, pub/sub system like redis or kafka. This helps manage multiple websocket connections with many users/devices more efficiently with multiple servers/clients interactions through on-premises servers or cloud orchestration.
- Implement payment status flow state machine to enforces stricter payment flow, as well as allowing more monitoring and control in a more asynchronous task like background, scheduler jobs (settlement, reconciliation)

## Gaps and imcomplete areas
- Payment detail page: the basis like API and component is there, just need to adjust routing and should be finished
- Due to complications in websocket connection setup, connections are closed when no more payments need updated, causing apps to force stop.

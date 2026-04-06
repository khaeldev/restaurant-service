export interface EventDetail {
  [key: string]: unknown
}

export interface IEventPublisher {
  publishEvent(
    source: string,
    detailType: string,
    detail: EventDetail
  ): Promise<void>
}

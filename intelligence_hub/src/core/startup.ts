export interface InitialCollectionHub {
  collectNews(): Promise<unknown>;
  collectMarkets(): Promise<unknown>;
}

export function startInitialCollections(hub: InitialCollectionHub): void {
  void Promise.allSettled([hub.collectNews(), hub.collectMarkets()]);
}

export const mockCanvas = (): void => {
  if (typeof window === 'undefined' || typeof window.HTMLCanvasElement === 'undefined') {
    return;
  }

  const canvasPrototype = window.HTMLCanvasElement.prototype as HTMLCanvasElement & {
    __mocked__?: boolean;
  };

  if (canvasPrototype.__mocked__) {
    return;
  }

  const stubContext = {
    fillRect: () => undefined,
    clearRect: () => undefined,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => undefined,
    createImageData: () => new ImageData(1, 1),
    setTransform: () => undefined,
    drawImage: () => undefined,
    save: () => undefined,
    fillText: () => undefined,
    restore: () => undefined,
    beginPath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    closePath: () => undefined,
    stroke: () => undefined,
    translate: () => undefined,
    scale: () => undefined,
    rotate: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    measureText: () => ({ width: 0 }),
    transform: () => undefined,
    rect: () => undefined,
    clip: () => undefined
  } as unknown as CanvasRenderingContext2D;

  const mockedGetContext = ((type: string) => {
    if (type === '2d') {
      return stubContext;
    }
    return null;
  }) as unknown as typeof canvasPrototype.getContext;

  canvasPrototype.getContext = mockedGetContext;
  canvasPrototype.__mocked__ = true;
};

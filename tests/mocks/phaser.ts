export const mockPhaser = () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!(window as unknown as { __PHASER_MOCKED__?: boolean }).__PHASER_MOCKED__) {
    (window as unknown as { __PHASER_MOCKED__?: boolean }).__PHASER_MOCKED__ = true;
  }
};

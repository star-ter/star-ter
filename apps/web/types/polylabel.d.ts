declare module '@mapbox/polylabel' {
  export default function polylabel(
    polygon: number[][][] | number[][][][],
    precision?: number
  ): [number, number];
}

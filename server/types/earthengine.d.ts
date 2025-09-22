declare module '@google/earthengine' {
  interface InitializeParams {
    type?: string;
    project_id?: string;
    private_key?: string;
    client_email?: string;
  }

  interface VisParams {
    min?: number;
    max?: number;
    bands?: string[];
    palette?: string[];
  }

  interface MapId {
    urlTemplate: string;
    formatTileUrl: (x: number, y: number, z: number) => string;
  }

  interface Image {
    select(bands: string | string[]): Image;
    subtract(other: Image | number): Image;
    multiply(other: Image | number): Image;
    reduce(reducer: any): Image;
    clip(geometry: any): Image;
    getMapId(visParams: VisParams): Promise<MapId>;
  }

  interface ImageCollection {
    filterDate(start: string, end: string): ImageCollection;
    filterBounds(geometry: any): ImageCollection;
    first(): Image;
    select(bands: string | string[]): ImageCollection;
    mean(): Image;
  }

  interface Geometry {
    buffer(distance: number): Geometry;
    bounds(): any;
  }

  interface FeatureCollection {
    filter(filter: any): FeatureCollection;
    geometry(): Geometry;
  }

  const ee: {
    initialize(params: InitializeParams): Promise<void>;
    ImageCollection(id: string): ImageCollection;
    Image: {
      constant(value: number): Image;
    };
    Geometry: {
      Point(coordinates: number[]): Geometry;
      Rectangle(coordinates: number[]): Geometry;
    };
    FeatureCollection(id: string): FeatureCollection;
    Filter: {
      eq(property: string, value: any): any;
    };
    Reducer: {
      sum(): any;
    };
  };

  export = ee;
}
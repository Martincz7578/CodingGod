import {
  buildingTypes,
  getBuildingData,
  blockSize,
  getbuildingImage,
  grid,
  gridWidth,
  gridHeight,
} from "./buildings.js";
import type { position } from "./buildings.js";

import { birth } from "./economy.js";

import { bgCtx } from "./game.js";

export class buildingData {
  type: buildingTypes;
  price: number;
  koeficient: number;
  size: {
    width: number;
    height: number;
  };
  productionSpeed?: number | undefined;
  requirements?: { [key: string]: number | undefined };
  constructor(
    type: buildingTypes,
    price: number,
    koeficient: number,
    size: { width: number; height: number },
    productionSpeed?: number,
    requirements?: { [key: string]: number }
  ) {
    this.type = type;
    this.price = price;
    this.koeficient = koeficient;
    this.size = size;
    this.productionSpeed = productionSpeed;
    this.requirements = requirements ?? {};
  }
}

export class Building {
  data: buildingData;
  position: position;
  householdMembers?: citizen[] = [];
  maxMembers?: number = 5;
  constructor(type: buildingTypes, position: position) {
    this.data = getBuildingData(type);
    this.position = position;
    for (
      let y = this.position.y;
      y < this.position.y + this.data.size.height;
      y += blockSize
    ) {
      for (
        let x = this.position.x;
        x < this.position.x + this.data.size.width;
        x += blockSize
      ) {
        const gy = Math.floor(y / blockSize);
        const gx = Math.floor(x / blockSize);
        if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) continue;
        if (!grid[gy]) grid[gy] = new Array(gridWidth).fill(null);
        grid[gy][gx] = this;
      }
    }
    if (type === buildingTypes.HOUSE) {
      for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
        this.householdMembers?.push(birth());
      }
    }
  }

  render() {
    bgCtx.drawImage(
      getbuildingImage(buildingTypes[this.data.type]),
      this.position.x,
      this.position.y,
      this.data.size.width,
      this.data.size.height
    );
  }
}

export class citizen {
  happiness: number;
  hunger: number;
  age: number;
  constructor(happiness: number, hunger: number) {
    this.happiness = happiness;
    this.hunger = hunger;
    this.age = 0;
  }
}

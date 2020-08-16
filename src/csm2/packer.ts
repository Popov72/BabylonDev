/******************************************************************************
From: https://github.com/jakesgordon/bin-packing

This is a very simple binary tree based bin packing algorithm that is initialized
with a fixed width and height and will fit each block into the first node where
it fits and then split that node into 2 parts (down and right) to track the
remaining whitespace.
Best results occur when the input blocks are sorted by height, or even better
when sorted by max(width,height).
Inputs:
------
  w:       width of target rectangle
  h:      height of target rectangle
  blocks: array of any objects that have .w and .h attributes
Outputs:
-------
  marks each block that fits with a .fit attribute pointing to a
  node with .x and .y coordinates
Example:
-------
  var blocks = [
    { w: 100, h: 100 },
    { w: 100, h: 100 },
    { w:  80, h:  80 },
    { w:  80, h:  80 },
    etc
    etc
  ];
  var packer = new Packer(500, 500);
  packer.fit(blocks);
  for(var n = 0 ; n < blocks.length ; n++) {
    var block = blocks[n];
    if (block.fit) {
      Draw(block.fit.x, block.fit.y, block.w, block.h);
    }
  }
******************************************************************************/
import { Nullable } from "babylonjs/types";

export interface IAtlasTile {
    w: number;
    h: number;
    fit?: Nullable<IAtlasNode>;
}

interface IAtlasNode {
    x: number;
    y: number;
    w: number;
    h: number;
    used?: boolean;
    right?: Nullable<IAtlasNode>;
    down?: Nullable<IAtlasNode>;
}

export class AtlasPacker {

    protected _root: IAtlasNode;

    constructor(w: number = 0, h: number = 0) {
        this._root = { x: 0, y: 0, w: w, h: h };
    }

    public fit(blocks: Array<IAtlasTile>): boolean {
        if (this._root.w === 0 && this._root.h === 0) {
            this._fitGrowing(blocks);
        } else {
            this._fit(blocks);
        }

        for (let n = 0 ; n < blocks.length ; n++) {
            if (!blocks[n].fit) {
                return false;
            }
        }

        return true;
    }

    public getSize(): { w: number, h: number } {
        return { w: this._root.w, h: this._root.h };
    }

    protected _fit(blocks: Array<IAtlasTile>) {
        let node: Nullable<IAtlasNode>;
        for (let n = 0; n < blocks.length; n++) {
            const block = blocks[n];
            if (node = this._findNode(this._root, block.w, block.h)) {
                block.fit = this._splitNode(node, block.w, block.h);
            }
        }
    }

    protected _fitGrowing(blocks: Array<IAtlasTile>) {
        const len = blocks.length;
        const w = len > 0 ? blocks[0].w : 0;
        const h = len > 0 ? blocks[0].h : 0;

        this._root.w = w;
        this._root.h = h;

        let node;
        for (let n = 0; n < len; n++) {
            const block = blocks[n];
            if (node = this._findNode(this._root, block.w, block.h)) {
                block.fit = this._splitNode(node, block.w, block.h);
            } else {
                block.fit = this._growNode(block.w, block.h);
            }
        }
    }


    protected _findNode(root: IAtlasNode, w: number, h: number): Nullable<IAtlasNode> {
        if (root.used) {
            return this._findNode(root.right!, w, h) || this._findNode(root.down!, w, h);
        } else if ((w <= root.w) && (h <= root.h)) {
            return root;
        }
        return null;
    }

    protected _splitNode(node: IAtlasNode, w: number, h: number): IAtlasNode {
        node.used = true;
        node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
        node.right = { x: node.x + w, y: node.y, w: node.w - w, h: h };

        return node;
    }

    protected _growNode(w: number, h: number): Nullable<IAtlasNode> {
        var canGrowDown = (w <= this._root.w);
        var canGrowRight = (h <= this._root.h);

        var shouldGrowRight = canGrowRight && (this._root.h >= (this._root.w + w)); // attempt to keep square-ish by growing right when height is much greater than width
        var shouldGrowDown = canGrowDown && (this._root.w >= (this._root.h + h)); // attempt to keep square-ish by growing down  when width  is much greater than height

        if (shouldGrowRight) {
            return this._growRight(w, h);
        } else if (shouldGrowDown) {
            return this._growDown(w, h);
        } else if (canGrowRight) {
            return this._growRight(w, h);
        } else if (canGrowDown) {
            return this._growDown(w, h);
        }

        return null; // need to ensure sensible root starting size to avoid this happening
    }

    protected _growRight(w: number, h: number): Nullable<IAtlasNode> {
        this._root = {
            used: true,
            x: 0,
            y: 0,
            w: this._root.w + w,
            h: this._root.h,
            down: this._root,
            right: { x: this._root.w, y: 0, w: w, h: this._root.h }
        };

        let node = this._findNode(this._root, w, h);

        return node ? this._splitNode(node, w, h) : null;
    }

    protected _growDown(w: number, h: number): Nullable<IAtlasNode> {
        this._root = {
          used: true,
          x: 0,
          y: 0,
          w: this._root.w,
          h: this._root.h + h,
          down:  { x: 0, y: this._root.h, w: this._root.w, h: h },
          right: this._root
        };

        let node = this._findNode(this._root, w, h);

        return node ? this._splitNode(node, w, h) : null;
    }
}
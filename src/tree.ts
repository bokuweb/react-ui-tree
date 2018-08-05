const JsTree = require("js-tree");

export type Placement = "before" | "after" | "prepend" | "append";

export interface TreeNode {
  module: string;
  children?: Array<TreeNode>;
  collapsed?: boolean;
  leaf?: boolean;
}

export interface NodeIndex {
  id: number;
  node: TreeNode;
  height?: number;
  children?: Array<TreeNode>;
}
export class Tree extends JsTree {
  constructor(tree: TreeNode) {
    super(tree);
  }

  updateNodesPosition() {
    let top = 1;
    let left = 1;
    let root = this.getIndex(1);
    let self = this;

    root.top = top++;
    root.left = left++;

    if (root.children && root.children.length) {
      walk(root.children, root, left, root.node.collapsed);
    }

    function walk(
      children: Array<TreeNode>,
      parent: NodeIndex,
      left: number,
      collapsed: boolean
    ) {
      let height = 1;
      children.forEach(id => {
        let node = self.getIndex(id);
        if (collapsed) {
          node.top = null;
          node.left = null;
        } else {
          node.top = top++;
          node.left = left;
        }

        if (node.children && node.children.length) {
          height += walk(
            node.children,
            node,
            left + 1,
            collapsed || node.node.collapsed
          );
        } else {
          node.height = 1;
          height += 1;
        }
      });

      if (parent.node.collapsed) parent.height = 1;
      else parent.height = height;
      return parent.height;
    }
  }

  move(fromId: number, toId: number, placement: Placement) {
    if (fromId === toId || toId === 1) return;

    const obj = this.remove(fromId);
    let index = null;

    if (placement === "before") index = this.insertBefore(obj, toId);
    else if (placement === "after") index = this.insertAfter(obj, toId);
    else if (placement === "prepend") index = this.prepend(obj, toId);
    else if (placement === "append") index = this.append(obj, toId);

    this.updateNodesPosition();
    return index;
  }

  getNodeByTop(top: number) {
    const indexes = this.indexes;
    for (const id in indexes) {
      if (indexes.hasOwnProperty(id)) {
        if (indexes[id].top === top) return indexes[id];
      }
    }
  }
}

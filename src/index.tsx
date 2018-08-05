import * as React from "react";
import { Tree, TreeNode } from "./tree";
import { Node } from "./node";

export interface TreeProps {
  paddingLeft?: number;
  tree: TreeNode;
  renderNode: (node: TreeNode) => JSX.Element;
  onChange?: (tree: TreeNode) => void;
}

interface Dragging {
  id: number | null;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
}

interface State {
  tree: Tree;
  dragging: Dragging;
}

const defaultDragging: Dragging = {
  id: null,
  x: null,
  y: null,
  w: null,
  h: null
};

const userSelectNone = {
  userSelect: "none",
  MozUserSelect: "none",
  WebkitUserSelect: "none",
  MsUserSelect: "none"
};

export class ReTree extends React.Component<TreeProps, State> {
  private _updated = false;
  private _startX = 0;
  private _startY = 0;
  private _offsetX = 0;
  private _offsetY = 0;
  private _start = false;

  dragging: Dragging = defaultDragging;

  static defaultProps = {
    paddingLeft: 20
  };

  constructor(props: TreeProps) {
    super(props);
    this.state = this.init(props);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onToggleCollapse = this.onToggleCollapse.bind(this);
  }

  componentWillReceiveProps(nextProps: TreeProps) {
    if (!this._updated) {
      this.setState(this.init(nextProps));
    }
  }

  init(props: TreeProps): State {
    const tree = new Tree(props.tree);
    tree.renderNode = props.renderNode;
    tree.updateNodesPosition();

    return {
      tree,
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    };
  }

  getDraggingDom = () => {
    const { tree, dragging } = this.state;

    if (dragging && dragging.id) {
      const draggingIndex = tree.getIndex(dragging.id);
      const draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      } as React.CSSProperties;

      return (
        <div className="m-draggable" style={draggingStyles}>
          <Node
            tree={tree}
            index={draggingIndex}
            paddingLeft={this.props.paddingLeft || 10}
          />
        </div>
      );
    }

    return null;
  };

  onDragStart(
    id: number,
    ref: HTMLElement | null,
    e: React.MouseEvent<HTMLElement>
  ) {
    if (e.button !== 0 || !ref) return;
    this.dragging = {
      id,
      w: ref.offsetWidth,
      h: ref.offsetHeight,
      x: ref.offsetLeft,
      y: ref.offsetTop
    };

    this._startX = ref.offsetLeft;
    this._startY = ref.offsetTop;
    this._offsetX = e.clientX;
    this._offsetY = e.clientY;
    this._start = true;

    window.addEventListener("mousemove", this.onDrag);
    window.addEventListener("mouseup", this.onDragEnd);
  }

  onDrag(e: MouseEvent) {
    if (this._start) {
      this.setState({
        dragging: this.dragging
      });
      this._start = false;
    }

    const tree = this.state.tree;
    const dragging = this.state.dragging;
    const paddingLeft = this.props.paddingLeft || 0;
    let newIndex = null;
    let index = tree.getIndex(dragging.id);
    const collapsed = index.node.collapsed;

    const _startX = this._startX;
    const _startY = this._startY;
    const _offsetX = this._offsetX;
    const _offsetY = this._offsetY;

    const pos = {
      x: _startX + e.clientX - _offsetX,
      y: _startY + e.clientY - _offsetY
    };
    dragging.x = pos.x;
    dragging.y = pos.y;

    const diffX = dragging.x - paddingLeft / 2 - (index.left - 2) * paddingLeft;
    const diffY =
      dragging.y - (dragging.h || 0) / 2 - (index.top - 2) * (dragging.h || 0);

    if (diffX < 0) {
      // left
      if (index.parent && !index.next) {
        newIndex = tree.move(index.id, index.parent, "after");
      }
    } else if (diffX > paddingLeft) {
      // right
      if (index.prev) {
        const prevNode = tree.getIndex(index.prev).node;
        if (!prevNode.collapsed && !prevNode.leaf) {
          newIndex = tree.move(index.id, index.prev, "append");
        }
      }
    }

    if (newIndex) {
      index = newIndex;
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if (diffY < 0) {
      // up
      const above = tree.getNodeByTop(index.top - 1);
      newIndex = tree.move(index.id, above.id, "before");
    } else if (diffY > (dragging.h || 0)) {
      // down
      if (index.next) {
        const below = tree.getIndex(index.next);
        if (below.children && below.children.length && !below.node.collapsed) {
          newIndex = tree.move(index.id, index.next, "prepend");
        } else {
          newIndex = tree.move(index.id, index.next, "after");
        }
      } else {
        const below = tree.getNodeByTop(index.top + index.height);
        if (below && below.parent !== index.id) {
          if (
            below.children &&
            below.children.length &&
            !below.node.collapsed
          ) {
            newIndex = tree.move(index.id, below.id, "prepend");
          } else {
            newIndex = tree.move(index.id, below.id, "after");
          }
        }
      }
    }

    if (newIndex) {
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }
    this.setState({
      tree: tree,
      dragging: dragging
    });
  }

  onDragEnd() {
    this.setState({
      dragging: defaultDragging
    });
    this.onChange(this.state.tree);
    window.removeEventListener("mousemove", this.onDrag);
    window.removeEventListener("mouseup", this.onDragEnd);
  }

  onChange(tree: Tree) {
    this._updated = true;
    if (this.props.onChange) this.props.onChange(tree.obj);
  }

  onToggleCollapse(nodeId: number) {
    const tree = this.state.tree;
    const index = tree.getIndex(nodeId);
    const node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    this.setState({ tree });

    this.onChange(tree);
  }

  render() {
    const tree = this.state.tree;
    const dragging = this.state.dragging;
    const draggingDom = this.getDraggingDom();
    const style = this._start !== null ? { ...userSelectNone } : {};
    return (
      <div className="m-tree" style={style}>
        {draggingDom}
        <Node
          tree={tree}
          index={tree.getIndex(1)}
          key={1}
          paddingLeft={this.props.paddingLeft || 10}
          onDragStart={this.onDragStart}
          onCollapse={this.onToggleCollapse}
          dragging={dragging && dragging.id}
        />
      </div>
    );
  }
}

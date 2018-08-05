import * as React from "react";
import { Tree, NodeIndex } from "./tree";

export interface TreeNodeProps {
  paddingLeft: number;
  tree: Tree;
  index: NodeIndex;
  dragging?: number | null;
  onCollapse?: (nodeId: number) => void;
  onDragStart?: (
    nodeId: number,
    ref: HTMLElement | null,
    e: React.MouseEvent<HTMLElement>
  ) => void;
}

export class Node extends React.Component<TreeNodeProps> {
  innerRef!: React.RefObject<HTMLDivElement>;

  constructor(props: TreeNodeProps) {
    super(props);
    this.innerRef = React.createRef();
    this.onCollapse = this.onCollapse.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  renderCollapse() {
    const { index } = this.props;
    if (index.children && index.children.length) {
      const { collapsed } = index.node;
      return (
        <span
          // className={cx('collapse', collapsed ? 'caret-right' : 'caret-down')}
          onMouseDown={e => e.stopPropagation()}
          onClick={this.onCollapse}
        >
          a
        </span>
      );
    }
    return null;
  }

  renderChildren(): JSX.Element | null {
    const { index, tree, dragging } = this.props;

    if (index.children && index.children.length) {
      const childrenStyles = {
        paddingLeft: this.props.paddingLeft
      };

      return (
        <div className="children" style={childrenStyles}>
          {index.children.map(child => {
            const childIndex = tree.getIndex(child);
            return (
              <Node
                tree={tree}
                index={childIndex}
                key={childIndex.id}
                dragging={dragging}
                paddingLeft={this.props.paddingLeft}
                onCollapse={this.props.onCollapse}
                onDragStart={this.props.onDragStart}
              />
            );
          })}
        </div>
      );
    }

    return null;
  }

  render() {
    const { tree, index, dragging } = this.props;
    const { node } = index;
    return (
      <div
      // className={cx('m-node', {
      //   placeholder: index.id === dragging
      // })}
      >
        <div
          className="__rt_inner"
          ref={this.innerRef}
          onMouseDown={this.onMouseDown}
        >
          {this.renderCollapse()}
          {tree.renderNode(node)}
        </div>
        {node.collapsed ? null : this.renderChildren()}
      </div>
    );
  }

  onCollapse(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();
    const nodeId = this.props.index.id;
    if (this.props.onCollapse) {
      this.props.onCollapse(nodeId);
    }
  }

  onMouseDown(e: React.MouseEvent<HTMLElement>) {
    const nodeId = this.props.index.id;
    const dom = this.innerRef.current;
    if (this.props.onDragStart) {
      this.props.onDragStart(nodeId, dom, e);
    }
  }
}

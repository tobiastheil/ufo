//@flow
import React from "react";

type Props = {
  scrollLeft: number,
  scrollable: boolean,
  className: string,
  children?: Element
};

export default class ScrollContainer extends React.Component {
  scroller: any;
  props: Props;
  constructor(props: Props) {
    super(props);
  }

  getScrollPosition = () => {
    return this.scroller.scrollLeft;
  };

  render() {
    return (
      <div
        className={this.props.className}
        ref={ref => {
          this.scroller = ref;
        }}
        style={{
          overflowX: this.props.scrollable ? "scroll" : "hidden"
        }}
      >
        {this.props.children}
      </div>
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.scrollLeft !== this.props.scrollLeft) {
      this.scroller.scrollLeft = this.props.scrollLeft;
    }
  }
}

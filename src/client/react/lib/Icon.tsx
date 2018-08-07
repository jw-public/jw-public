import * as React from "react";
import * as ReactDOM from "react-dom";

interface IconProps {
  name: string;
  className?: string;
  size?: string;
  rotate?: string;
  flip?: string;
  fixedWidth?: boolean;
  spin?: boolean;
  pulse?: boolean;
  stack?: string;
  inverse?: boolean;
}

export default class Icon extends React.Component<any, any> {

  render() {

    let props = this.props;

    let classNames = `fa fa-${props.name}`;
    if (props.size) {
      classNames = `${classNames} fa-${props.size}`;
    }
    if (props.rotate) {
      classNames = `${classNames} fa-rotate-${props.rotate}`;
    }
    if (props.flip) {
      classNames = `${classNames} fa-flip-${props.flip}`;
    }
    if (props.fixedWidth) {
      classNames = `${classNames} fa-fw`;
    }
    if (props.spin) {
      classNames = `${classNames} fa-spin`;
    }
    if (props.pulse) {
      classNames = `${classNames} fa-pulse`;
    }

    if (props.stack) {
      classNames = `${classNames} fa-stack-${props.stack}`;
    }
    if (props.inverse) {
      classNames = `${classNames} fa-inverse`;
    }

    if (props.className) {
      classNames = `${classNames} ${props.className}`;
    }
    return <i className={classNames} />;
  }
}

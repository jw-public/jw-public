import * as React from "react";
import * as ReactDOM from "react-dom";

export default class MeteorComponent<P, S, D> extends React.Component<P, S> {
  public data: D;
  public getMeteorData(): D {
    throw new Error("MeteorComponent subclass must implement getMeteorData()");
  }
}

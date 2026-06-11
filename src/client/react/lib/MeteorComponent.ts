import * as React from "react";

export default class MeteorComponent<P, S, D> extends React.Component<P, S> {
  // assigned by the subclass lifecycle before first use
  public data!: D;
  public getMeteorData(): D {
    throw new Error("MeteorComponent subclass must implement getMeteorData()");
  }
}

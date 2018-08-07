

declare class ReactiveArray<T> extends Array<T> {

  constructor(array?: Array<T>)

  /** It returns all elements as a plain Javascript array. */
  public array(): Array<T>;
  /**
  * It returns a reactive source of the array.
  * An array variable isn't reactive by itself, you need to execute a function with dependency.depend() for Meteor to recognize it as a reactive source. The .list() method does just that.
  */
  public list(): ReactiveArray<T>;
  /**
  *It returns a reactive source of the array.
  *An array variable isn't reactive by itself, you need to execute a function with dependency.depend() for Meteor to recognize it as a reactive source.
  *The .depend() method does just that.
  */
  public depend(): ReactiveArray<T>;
  /** It removes all elements from the array. */
  public clear(): void;

}

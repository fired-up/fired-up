export interface LooseObject {
  [key: string]: any;
}

type Diff<T extends keyof any, U extends keyof any> = ({ [P in T]: P } &
  { [P in U]: never } & { [x: string]: never })[T];

/**
 * Allows for overwriting a property within a type
 * https://stackoverflow.com/questions/49198713/override-the-properties-of-an-interface-in-typescript
 */
export type Overwrite<T, U> = Pick<T, Diff<keyof T, keyof U>> & U;

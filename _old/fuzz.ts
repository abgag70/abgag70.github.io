// Abstract class first
abstract class Creature {
    abstract breathe(): void;
}

// Enum Declaration
enum Colors {
    Red = "RED",
    Green = "GREEN",
    Blue = "BLUE"
}

// Interface with Type Literal and Index Signature
interface Person {
    name: string;
    age: number;
    [prop: string]: string | number;
}

// Type Alias with Union, Intersection and Tuple
type Identifier = string | number;
type Point = { x: number; y: number; };
type LabeledPoint = Point & { label: string; };
type TupleExample = [number, string, boolean];

// Interface Inheritance
interface Runnable {
    run(speed: number): void;
}

interface Movable extends Runnable {
    move(distance: number): void;
}

// Class with Generics, Inheritance
class Animal<T> extends Creature implements Movable {
    static species: string = "Unknown";

    constructor(public name: string, private readonly type: T) {
        super();
    }

    move(distance: number = 0): void {
        console.log(`${this.name} moved ${distance}m.`);
    }

    run(speed: number): void {
        console.log(`${this.name} ran at ${speed}km/h.`);
    }

    breathe(): void {
        console.log(`${this.name} is breathing.`);
    }

    async fetch(): Promise<T> {
        return this.type;
    }
}

// Function Declaration with Generics and Constraints
function identity<T extends string | number>(arg: T): T {
    return arg;
}

// Arrow Function
const add = (a: number, b: number): number => a + b;

// Type Assertion
const someValue: any = "this is a string";
const strLength: number = (someValue as string).length;

// Mapped Type
type OptionsFlags<Type> = {
    [Property in keyof Type]: boolean;
};

// Conditional Type
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;

// Literal Type
type Direction = "left" | "right" | "up" | "down";

// Function Overloading
function overloaded(x: number): number;
function overloaded(x: string): string;
function overloaded(x: any): any {
    return x;
}

// Interface with optional and readonly properties
interface ReadOnlyPoint {
    readonly x: number;
    readonly y: number;
    z?: number;
}

// Using typeof type operator
let greeting = "hello";
type Greeting = typeof greeting;

// Union, Intersection, Nullable types
type Status = "pending" | "active" | "disabled";
type Account = {
    id: number;
    status: Status | null;
} & Person;

// Namespace Declaration
namespace MyNamespace {
    export const nsValue: number = 42;

    export function greet(): string {
        return "Hello from namespace!";
    }
}

// Declare Global Variable
declare var globalVar: string;

// Ambient Module (safe dummy)
declare module "external-library" {
    export function externalFunction(): void;
}

// BigInt, Template Literal Types
const bigIntValue: bigint = 100n;
type GreetingTemplate = `Hello, ${string}`;

// Private, Protected Fields
class Example {
    private secret: string = "shh";
    protected hidden(): void {}
    public visible(): void {}
}

// Optional Chaining, Nullish Coalescing
const maybePerson: Person | undefined = undefined;
const nameLength = (maybePerson as Person | undefined)?.name.length ?? 0;

// Using keyof, typeof in types
type PersonKeys = keyof Person;
const key: PersonKeys = "name";

// Recursive Type
type JSONValue = string | number | boolean | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue; }
interface JSONArray extends Array<JSONValue> {}

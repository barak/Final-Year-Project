import * as Asserts from "../setanta/src/asserts";
import { RuntimeError } from "../setanta/src/error";
import { Parser } from "../setanta/src/gen_parser";
import { Interpreter, STOP } from "../setanta/src/i10r";
import { callFunc, goLitreacha, ObjWrap, Value } from "../setanta/src/values";
import { genBuiltins } from "./builtins";
import { DisplayEngine } from "./engine";

export class ExecCtx {
    private writeFn: (x: string) => void;
    private display: DisplayEngine;
    private halt: boolean = true;
    private interpreter: Interpreter | null = null;
    private currentWriteWait: ((s: string) => void) | null = null;

    constructor(write: (x: string) => void, display: DisplayEngine) {
        this.writeFn = write;
        this.display = display;
    }

    public handleKeyDown(e: KeyboardEvent) {
        this.display.keyFn(e.code);
    }

    public stop() {
        this.halt = true;
        if (this.interpreter) {
            this.interpreter.stop();
        }
    }

    public running(): boolean {
        return !this.halt;
    }

    public write(s: string) {
        if (this.currentWriteWait) {
            this.currentWriteWait(s);
            this.currentWriteWait = null;
        }
    }

    public async run(prog: string) {
        const builtins = genBuiltins(this.display, this.writeFn,
            (fn) => { this.currentWriteWait = fn; });

        const p = new Parser(prog);
        const res = p.parse();
        if (res.err) {
            return res.err;
        }
        const ast = res.ast!;
        const i = new Interpreter(builtins);
        this.interpreter = i;
        this.halt = false;
        try {
            await i.interpret(ast);
        } catch (e) {
            if (e instanceof RuntimeError) {
                alert(e.msg);
            } else {
                throw e;
            }
        } finally {
            this.stop();
        }
    }

}

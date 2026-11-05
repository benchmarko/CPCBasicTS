export interface ExecutionState {
	readonly reason: string
	readonly line: string | number
	readonly isRunning: boolean
}

export class ExecutionStateReporter {
	private previous?: ExecutionState;

	constructor(private readonly onChange?: (state: ExecutionState) => void) {}

	report(state: ExecutionState): void {
		const previous = this.previous;
		if (previous && previous.reason === state.reason && previous.line === state.line && previous.isRunning === state.isRunning) {
			return;
		}
		this.previous = { ...state };
		this.onChange?.({ ...state });
	}
}
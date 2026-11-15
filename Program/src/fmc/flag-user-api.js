/** USER API. UI edits take precedence over AGENT leases on the same slice. */
export class UserFlagGateway {
  #session;
  #userId;
  constructor(session, userId = 'USER') {
    this.#session = session;
    this.#userId = userId;
  }
  edit(index, content) {
    // USER takeover is handled by the session/FMC before MVCC commit.
    return this.#session.edit(index, content, 'USER');
  }
  patch(index, change) { return this.#session.editPatch(index, change, this.#userId); }
  status(index) { return this.#session.getFlagStatus(index); }
  owned() { return this.#session.listOwnedFlags(this.#userId); }
}

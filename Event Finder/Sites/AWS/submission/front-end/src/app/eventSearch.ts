export class EventSearch {
  constructor(
    public keyword: string,
    public category: string,
    public location: string,
    public autoLocation: boolean,
    public distance?: number
  ) {}
  }
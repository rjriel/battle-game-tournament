import { BattleGameTournamentPage } from './app.po';

describe('battle-game-tournament App', function() {
  let page: BattleGameTournamentPage;

  beforeEach(() => {
    page = new BattleGameTournamentPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});

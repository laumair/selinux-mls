import { MlsPage } from './app.po';

describe('mls App', () => {
  let page: MlsPage;

  beforeEach(() => {
    page = new MlsPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});

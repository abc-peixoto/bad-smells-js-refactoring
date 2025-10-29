const REPORT_TYPES = {
  CSV: 'CSV',
  HTML: 'HTML',
};

const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

const STANDARD_USER_VALUE_LIMIT = 500;
const PRIORITY_VALUE_LIMIT = 1000;

class CsvReportRenderer {
  constructor(user) {
    this.user = user;
  }

  render(items, total) {
    return [
      'ID,NOME,VALOR,USUARIO',
      ...items.map((item) => this.renderRow(item)),
      '',
      'Total,,',
      `${total},,`,
    ].join('\n');
  }

  renderRow(item) {
    return `${item.id},${item.name},${item.value},${this.user.name}`;
  }
}

class HtmlReportRenderer {
  constructor(user) {
    this.user = user;
  }

  render(items, total) {
    return [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${this.user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
      ...items.map((item) => this.renderRow(item)),
      '</table>',
      `<h3>Total: ${total}</h3>`,
      '</body></html>',
    ].join('\n');
  }

  renderRow(item) {
    const attributes = item.priority ? ' style="font-weight:bold;"' : '';
    return `<tr${attributes}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
  }
}

class EmptyReportRenderer {
  render() {
    return '';
  }
}

const RENDERERS_BY_TYPE = {
  [REPORT_TYPES.CSV]: CsvReportRenderer,
  [REPORT_TYPES.HTML]: HtmlReportRenderer,
};

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  generateReport(reportType, user, items) {
    const visibleItems = this.selectItemsForUser(user, items);
    const total = this.calculateTotal(visibleItems);
    const renderer = this.createRenderer(reportType, user);

    return renderer.render(visibleItems, total).trim();
  }

  selectItemsForUser(user, items) {
    if (user.role === USER_ROLES.ADMIN) {
      return items.map((item) => this.prepareAdminItem(item));
    }

    if (user.role === USER_ROLES.USER) {
      return items.filter((item) => item.value <= STANDARD_USER_VALUE_LIMIT);
    }

    return [];
  }

  prepareAdminItem(item) {
    if (item.value > PRIORITY_VALUE_LIMIT) {
      item.priority = true;
    }

    return item;
  }

  calculateTotal(items) {
    return items.reduce((total, item) => total + item.value, 0);
  }

  createRenderer(reportType, user) {
    const Renderer = RENDERERS_BY_TYPE[reportType] ?? EmptyReportRenderer;
    return new Renderer(user);
  }
}

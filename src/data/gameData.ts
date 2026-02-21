export type FieldType = 'start' | 'income' | 'expense' | 'quiz' | 'listing' | 'jail' | 'switch' | 'investment' | 'tax_small' | 'tax_large' | 'auction_insurance';
export type GameMode = 'finance' | 'sustainability';

export interface Level {
  id: number;
  type: FieldType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index of correct option (0=A, 1=B, 2=C, 3=D)
  explanation: string;
  mode: GameMode;
  reward: number;
  penalty: number;
}

export interface ListingChallenge {
  prompt: string;
  answers: string[];
  required: number;
  mode: GameMode;
  reward: number;
  penalty: number;
}

export interface IncomeEvent {
  title: string;
  description: string;
  amount: number;
  icon: string;
}

export interface ExpenseEvent {
  title: string;
  description: string;
  amount: number;
  icon: string;
}

export const investmentOutcomes: { diceRange: [number, number]; result: 'lose' | 'even' | 'win'; multiplier: number; message: string }[] = [
  { diceRange: [1, 1], result: 'lose', multiplier: 0,    message: '📉 Total Loss. The market crashed!' },
  { diceRange: [2, 2], result: 'lose', multiplier: 0,    message: '📉 Total Loss. High-risk failure.' },
  { diceRange: [3, 3], result: 'lose', multiplier: 0.5,  message: '📉 Significant Loss. Market downturn.' },
  { diceRange: [4, 4], result: 'even', multiplier: 1.0,  message: '⚖️ Sideways Trend. You broke even.' },
  { diceRange: [5, 5], result: 'win',  multiplier: 2.0,  message: '🚀 Bull Market! You doubled your money.' },
  { diceRange: [6, 6], result: 'win',  multiplier: 4.0,  message: '✨ Jackpot! You quadrupled your money!' },
];

export function getInvestmentResult(dice: number): { multiplier: number; message: string; result: 'lose' | 'even' | 'win' } {
  const outcome = investmentOutcomes.find(o => dice >= o.diceRange[0] && dice <= o.diceRange[1]);
  return outcome || { multiplier: 1, message: 'Break even.', result: 'even' };
}

// ─────────────────────────────────────────────
//  FINANCE QUIZZES — A/B/C/D multiple choice
// ─────────────────────────────────────────────
export const financeQuizzes: QuizQuestion[] = [
  {
    question: "What is 'passive income'?",
    options: [
      "A) Money earned with little or no active effort (rent, dividends)",
      "B) Income from a full-time job",
      "C) Government welfare payments",
      "D) Money borrowed from a bank",
    ],
    correct: 0,
    explanation: "Passive income is money earned without direct time investment – e.g., rent, dividends, royalties.",
    mode: 'finance', reward: 60000, penalty: 50000,
  },
  {
    question: "What does ETF stand for?",
    options: [
      "A) Extra Tax Fund",
      "B) Equity Transfer Fee",
      "C) Exchange-Traded Fund",
      "D) Extended Treasury Finance",
    ],
    correct: 2,
    explanation: "An ETF (Exchange-Traded Fund) tracks an index like the S&P 500 and trades on the exchange like a stock.",
    mode: 'finance', reward: 65000, penalty: 55000,
  },
  {
    question: "In the 50/30/20 budgeting rule, what does the 20% represent?",
    options: [
      "A) Entertainment and dining",
      "B) Housing and rent",
      "C) Food and groceries",
      "D) Savings and debt repayment",
    ],
    correct: 3,
    explanation: "The 50/30/20 rule: 50% needs, 30% wants, 20% savings and debt repayment.",
    mode: 'finance', reward: 35000, penalty: 30000,
  },
  {
    question: "What is inflation?",
    options: [
      "A) A rise in interest rates set by the government",
      "B) A general increase in prices reducing purchasing power",
      "C) The growth rate of a country's GDP",
      "D) A type of investment bond",
    ],
    correct: 1,
    explanation: "Inflation is a general rise in prices, meaning the same money buys fewer goods and services over time.",
    mode: 'finance', reward: 30000, penalty: 25000,
  },
  {
    question: "What is compound interest?",
    options: [
      "A) Interest paid only on the original principal",
      "B) A fixed government tax on savings",
      "C) Interest earned on both principal and previously earned interest",
      "D) A penalty fee for early loan repayment",
    ],
    correct: 2,
    explanation: "Compound interest is 'interest on interest'. Einstein called it the 8th wonder of the world!",
    mode: 'finance', reward: 60000, penalty: 50000,
  },
  {
    question: "What does ROI stand for?",
    options: [
      "A) Rate of Inflation",
      "B) Return on Investment",
      "C) Risk of Insolvency Index",
      "D) Revenue Over Income",
    ],
    correct: 1,
    explanation: "ROI (Return on Investment) measures the gain or loss from an investment relative to its cost.",
    mode: 'finance', reward: 35000, penalty: 30000,
  },
  {
    question: "What is a 'bear market'?",
    options: [
      "A) A market with rising prices and investor optimism",
      "B) A market focused on commodities like timber",
      "C) A stock market index for large companies",
      "D) A market where prices fall 20% or more from recent highs",
    ],
    correct: 3,
    explanation: "A bear market is when prices fall 20%+ from recent highs, often with widespread pessimism.",
    mode: 'finance', reward: 40000, penalty: 35000,
  },
  {
    question: "What is portfolio diversification?",
    options: [
      "A) Putting all money into the highest-performing stock",
      "B) Spreading investments across different asset types to reduce risk",
      "C) Investing only in government bonds",
      "D) Withdrawing all funds from the stock market",
    ],
    correct: 1,
    explanation: "Diversification reduces risk by spreading investments across different asset classes and sectors.",
    mode: 'finance', reward: 40000, penalty: 35000,
  },
  {
    question: "How is net worth calculated?",
    options: [
      "A) Total assets + Total liabilities",
      "B) Annual income – Annual expenses",
      "C) Total assets – Total liabilities",
      "D) Monthly salary × 12",
    ],
    correct: 2,
    explanation: "Net worth = Total assets (what you own) minus total liabilities (what you owe).",
    mode: 'finance', reward: 35000, penalty: 30000,
  },
  {
    question: "What is Dollar-Cost Averaging (DCA)?",
    options: [
      "A) Converting dollars to foreign currency at fixed rates",
      "B) Investing a fixed amount at regular intervals regardless of price",
      "C) Buying stocks only when prices hit a low",
      "D) Averaging the cost of daily expenses",
    ],
    correct: 1,
    explanation: "DCA means investing a fixed amount regularly, reducing the impact of market volatility.",
    mode: 'finance', reward: 50000, penalty: 45000,
  },
  {
    question: "What is a bond?",
    options: [
      "A) A share of ownership in a company",
      "B) A type of savings account with no interest",
      "C) A loan from an investor to a government or company",
      "D) A contract for future delivery of a commodity",
    ],
    correct: 2,
    explanation: "A bond is a loan from the investor to a borrower who pays back with interest over time.",
    mode: 'finance', reward: 40000, penalty: 35000,
  },
  {
    question: "What does the P/E ratio measure?",
    options: [
      "A) Profit vs. Expenses",
      "B) A stock's price relative to its earnings per share",
      "C) Public vs. Equity market size",
      "D) Portfolio Efficiency rating",
    ],
    correct: 1,
    explanation: "The P/E ratio compares a stock's price to its earnings per share – a key valuation metric.",
    mode: 'finance', reward: 60000, penalty: 50000,
  },
  {
    question: "What is gross income?",
    options: [
      "A) Income earned from investments only",
      "B) Your take-home pay after all deductions",
      "C) Your total earnings before any taxes or deductions",
      "D) Profits from selling a business",
    ],
    correct: 2,
    explanation: "Gross income is your total earnings before any deductions. Net income is what you take home.",
    mode: 'finance', reward: 35000, penalty: 30000,
  },
  {
    question: "What is financial leverage?",
    options: [
      "A) Using borrowed capital to amplify potential investment returns",
      "B) Negotiating a lower interest rate with your bank",
      "C) Splitting investment risk equally across assets",
      "D) The ability to liquidate assets quickly",
    ],
    correct: 0,
    explanation: "Leverage means using borrowed money to amplify returns — but it also amplifies risk and losses.",
    mode: 'finance', reward: 50000, penalty: 45000,
  },
  {
    question: "What is the Rule of 72?",
    options: [
      "A) A tax rule limiting deductions to 72% of income",
      "B) A law requiring 72-hour notice before withdrawing funds",
      "C) A budgeting principle saving 72% of every paycheck",
      "D) Divide 72 by the annual interest rate to estimate how long it takes to double your money",
    ],
    correct: 3,
    explanation: "Divide 72 by your annual interest rate to estimate the years needed to double your investment.",
    mode: 'finance', reward: 60000, penalty: 50000,
  },
  {
    question: "What is amortization?",
    options: [
      "A) Gradually paying off a loan through regular installments",
      "B) The process of converting assets to cash instantly",
      "C) A tax deduction for business losses",
      "D) An increase in asset value over time",
    ],
    correct: 0,
    explanation: "Amortization is paying off a loan through regular installments of principal and interest.",
    mode: 'finance', reward: 40000, penalty: 35000,
  },
  {
    question: "What is a 'bull market'?",
    options: [
      "A) A commodity market trading livestock",
      "B) A market where prices are falling sharply",
      "C) A market where prices rise 20%+ with investor confidence",
      "D) A government-controlled stock exchange",
    ],
    correct: 2,
    explanation: "A bull market is characterized by rising prices, investor confidence, and economic growth.",
    mode: 'finance', reward: 35000, penalty: 30000,
  },
  {
    question: "What is opportunity cost?",
    options: [
      "A) The fee charged for missed investment opportunities",
      "B) The cost of purchasing a business opportunity",
      "C) The value of the next best alternative you give up when making a decision",
      "D) A penalty tax on unused capital",
    ],
    correct: 2,
    explanation: "Opportunity cost is what you sacrifice when choosing one option over another.",
    mode: 'finance', reward: 40000, penalty: 35000,
  },
  {
    question: "What is a credit score used for?",
    options: [
      "A) Measuring a country's economic output",
      "B) Assessing your creditworthiness for loans and mortgages",
      "C) Calculating the total value of your investments",
      "D) Tracking your annual spending",
    ],
    correct: 1,
    explanation: "A credit score tells lenders how likely you are to repay debt. Higher scores = better loan terms.",
    mode: 'finance', reward: 30000, penalty: 25000,
  },
  {
    question: "What is an emergency fund?",
    options: [
      "A) A government fund for natural disasters",
      "B) Money set aside to cover 3–6 months of living expenses",
      "C) A high-risk investment for quick returns",
      "D) Insurance for your primary bank account",
    ],
    correct: 1,
    explanation: "An emergency fund protects you from going into debt during unexpected events.",
    mode: 'finance', reward: 30000, penalty: 25000,
  },
  {
    question: "What is a mutual fund?",
    options: [
      "A) A fund where two companies jointly invest",
      "B) A government savings scheme",
      "C) A fund that pools money from many investors, managed by professionals",
      "D) A private bank account with guaranteed returns",
    ],
    correct: 2,
    explanation: "A mutual fund pools money from many investors and is managed by professional fund managers.",
    mode: 'finance', reward: 35000, penalty: 30000,
  },
  {
    question: "What is capital gains tax?",
    options: [
      "A) Tax on your annual salary",
      "B) Tax on profits from selling an investment or asset",
      "C) A fee for opening a new bank account",
      "D) Tax on imported goods",
    ],
    correct: 1,
    explanation: "Capital gains tax is paid on the profit you make when selling assets like stocks or real estate.",
    mode: 'finance', reward: 50000, penalty: 45000,
  },
  {
    question: "What does 'liquidity' mean in finance?",
    options: [
      "A) The total value of a company's water assets",
      "B) How profitable an investment is over 10 years",
      "C) The volatility of a stock price",
      "D) How quickly an asset can be converted to cash without losing much value",
    ],
    correct: 3,
    explanation: "Liquidity is how quickly an asset can be converted to cash without losing much value.",
    mode: 'finance', reward: 40000, penalty: 35000,
  },
  {
    question: "What is asset allocation?",
    options: [
      "A) Dividing a portfolio among stocks, bonds, and other assets based on risk tolerance",
      "B) Selling all assets during a market crash",
      "C) Allocating company resources to employees",
      "D) Calculating total asset value for tax purposes",
    ],
    correct: 0,
    explanation: "Asset allocation divides a portfolio based on goals and risk tolerance across asset classes.",
    mode: 'finance', reward: 40000, penalty: 35000,
  },
  {
    question: "What is a dividend?",
    options: [
      "A) A penalty charged for early stock withdrawal",
      "B) The interest paid on a savings bond",
      "C) A portion of company profits distributed to shareholders",
      "D) A tax rebate from the government",
    ],
    correct: 2,
    explanation: "A dividend is a portion of company profits distributed to shareholders.",
    mode: 'finance', reward: 35000, penalty: 30000,
  },
  {
    question: "What is a hedge fund?",
    options: [
      "A) A fund for investing in agricultural land",
      "B) A government savings protection scheme",
      "C) A basic index fund tracking the S&P 500",
      "D) An alternative investment fund using complex strategies for wealthy investors",
    ],
    correct: 3,
    explanation: "Hedge funds use complex strategies like short-selling and leverage for institutional investors.",
    mode: 'finance', reward: 60000, penalty: 50000,
  },
  {
    question: "Which of these is the MOST liquid asset?",
    options: [
      "A) Cash",
      "B) Real estate property",
      "C) Private equity stake",
      "D) Vintage wine collection",
    ],
    correct: 0,
    explanation: "Cash is the most liquid asset because it can be used immediately without any conversion.",
    mode: 'finance', reward: 30000, penalty: 25000,
  },
  {
    question: "What is zero-based budgeting?",
    options: [
      "A) A budget that starts fresh every year with no data",
      "B) Spending exactly zero on non-essentials",
      "C) Budgeting only for zero-carbon purchases",
      "D) Assigning every euro of income a specific purpose so income minus expenses equals zero",
    ],
    correct: 3,
    explanation: "Zero-based budgeting assigns every euro a job so income minus expenses equals zero.",
    mode: 'finance', reward: 50000, penalty: 45000,
  },
  {
    question: "What is a budget deficit?",
    options: [
      "A) When expenses consistently exceed income",
      "B) A surplus in a government's annual revenue",
      "C) The difference between gross and net income",
      "D) A tax applied when savings exceed a threshold",
    ],
    correct: 0,
    explanation: "A budget deficit occurs when spending exceeds income over a given period.",
    mode: 'finance', reward: 30000, penalty: 25000,
  },
  {
    question: "What is the 'real return' on an investment?",
    options: [
      "A) The gross return before any fees",
      "B) The return after subtracting the inflation rate",
      "C) The return from physical assets only",
      "D) The average return over 10 years",
    ],
    correct: 1,
    explanation: "The real return shows purchasing power growth after accounting for inflation.",
    mode: 'finance', reward: 50000, penalty: 45000,
  },
  {
    question: "What is a fiduciary duty?",
    options: [
      "A) A legal obligation to act in the best interest of another party",
      "B) The responsibility of a bank to offer the lowest interest rates",
      "C) A government rule preventing all investment losses",
      "D) An agreement between two people to split investment profits",
    ],
    correct: 0,
    explanation: "A fiduciary is legally required to act in their client's best interest, not their own.",
    mode: 'finance', reward: 80000, penalty: 70000,
  },
  {
    question: "What is 'shrinkflation'?",
    options: [
      "A) A decrease in the general price level of goods",
      "B) Reducing the size of a product while keeping its price the same",
      "C) When a currency's value increases globally",
      "D) A tax on small businesses",
    ],
    correct: 1,
    explanation: "Shrinkflation is a hidden form of inflation where products get smaller but cost the same.",
    mode: 'finance', reward: 80000, penalty: 70000,
  },
  {
    question: "What is a 'penny stock'?",
    options: [
      "A) A high-value stock like Apple or Google",
      "B) A stock that pays only one penny in dividends",
      "C) A low-priced, high-risk stock of a small company",
      "D) A currency-themed commemorative coin",
    ],
    correct: 2,
    explanation: "Penny stocks are very cheap and highly speculative investments, often prone to manipulation.",
    mode: 'finance', reward: 85000, penalty: 70000,
  },
  {
    question: "What is the main goal of the Federal Reserve (or central banks)?",
    options: [
      "A) To ensure everyone has a high-paying job",
      "B) To manage the money supply and maintain price stability",
      "C) To collect taxes for the national government",
      "D) To print as much money as possible",
    ],
    correct: 1,
    explanation: "Central banks aim for price stability (low inflation) and sustainable economic growth.",
    mode: 'finance', reward: 80000, penalty: 70000,
  },
  {
    question: "What is a 'blue-chip' stock?",
    options: [
      "A) A stock in a technology startup",
      "B) A stock that has lost value for five years straight",
      "C) A stock in a well-established, financially sound company",
      "D) A stock used exclusively for international trade",
    ],
    correct: 2,
    explanation: "Blue-chip stocks belong to large, reputable companies with a history of reliable earnings.",
    mode: 'finance', reward: 80000, penalty: 70000,
  },
  {
    question: "What is short selling?",
    options: [
      "A) Selling a stock you own for a small profit",
      "B) Borrowing a stock to sell it, hoping its price will drop so you can buy it back cheaper",
      "C) Buying a stock for a very short period (less than a day)",
      "D) Selling assets at a discount due to urgency",
    ],
    correct: 1,
    explanation: "Short selling is a bet that a stock's price will go down.",
    mode: 'finance', reward: 85000, penalty: 75000,
  },
  {
    question: "What is the 'Rule of 100' in investing?",
    options: [
      "A) Saving 100% of your income for one month",
      "B) Subtracting your age from 100 to determine the % of your portfolio in stocks",
      "C) Investing only in the top 100 companies",
      "D) Paying off all debts before you reach 100 years old",
    ],
    correct: 1,
    explanation: "The Rule of 100 (or 110/120) is a simple guide for balancing stocks and bonds as you age.",
    mode: 'finance', reward: 80000, penalty: 70000,
  },
  {
    question: "What is 'phishing' in financial security?",
    options: [
      "A) A hobby for retired investors",
      "B) Buying stocks in the fishing and seafood industry",
      "C) Fraudulent attempts to obtain sensitive info by disguising as a trustworthy entity",
      "D) A method for analyzing market 'currents'",
    ],
    correct: 2,
    explanation: "Phishing is a scam where attackers try to steal your login or bank details via fake emails/texts.",
    mode: 'finance', reward: 80000, penalty: 70000,
  },
  {
    question: "What is a 'vesting period'?",
    options: [
      "A) The time it takes for a check to clear",
      "B) The time an employee must wait before owning employer-provided assets (like stock options)",
      "C) The duration of a fixed-term bank deposit",
      "D) The period during which a tax return is audited",
    ],
    correct: 1,
    explanation: "Vesting periods are often used to encourage employees to stay with a company longer.",
    mode: 'finance', reward: 80000, penalty: 70000,
  },
  {
    question: "What is an index fund?",
    options: [
      "A) A fund that tries to 'beat' the market using expert picks",
      "B) A fund that tracks a specific market index (like the S&P 500) for broad market exposure",
      "C) A fund that only invests in the gold index",
      "D) A list of all your personal bank accounts",
    ],
    correct: 1,
    explanation: "Index funds provide low-cost diversification by mimicking the performance of a whole market.",
    mode: 'finance', reward: 85000, penalty: 75000,
  },
];

// ─────────────────────────────────────────────
//  SUSTAINABILITY QUIZZES — A/B/C/D multiple choice
// ─────────────────────────────────────────────
export const sustainabilityQuizzes: QuizQuestion[] = [
  {
    question: "What is a 'carbon footprint'?",
    options: [
      "A) The total greenhouse gas emissions caused by a person or organization",
      "B) The amount of carbon stored in a forest",
      "C) A government tax on fossil fuel companies",
      "D) The physical land area damaged by carbon dioxide",
    ],
    correct: 0,
    explanation: "A carbon footprint measures the total greenhouse gas emissions from all activities of a person or entity.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What does ESG stand for in sustainable investing?",
    options: [
      "A) Economic, Social, and Governance",
      "B) Energy Savings and Governance",
      "C) Environmental, Social, and Governance",
      "D) Ethical Spending Guidelines",
    ],
    correct: 2,
    explanation: "ESG investing considers Environmental, Social, and Governance factors alongside financial returns.",
    mode: 'sustainability', reward: 140000, penalty: 120000,
  },
  {
    question: "What is a 'circular economy'?",
    options: [
      "A) An economy where money circulates only within one country",
      "B) A financial model based on round-the-clock trading",
      "C) An economy model eliminating waste by keeping resources in use through reuse and recycling",
      "D) A system where all goods are produced locally",
    ],
    correct: 2,
    explanation: "A circular economy is a regenerative system that minimizes waste by keeping resources in use.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What was the Paris Agreement of 2015?",
    options: [
      "A) A trade deal between the EU and the US",
      "B) An international agreement to limit global warming to 1.5–2°C above pre-industrial levels",
      "C) A French law banning single-use plastics",
      "D) A UN resolution on ocean pollution",
    ],
    correct: 1,
    explanation: "The Paris Agreement (2015) is a global treaty where 196 countries pledged to limit warming.",
    mode: 'sustainability', reward: 140000, penalty: 120000,
  },
  {
    question: "What does 'net zero' mean?",
    options: [
      "A) Producing zero products with any carbon",
      "B) Achieving a balance between emitting and removing greenhouse gases",
      "C) Using only zero-carbon transport methods",
      "D) Reducing energy consumption to zero",
    ],
    correct: 1,
    explanation: "Net zero means removing as much greenhouse gas as you emit, achieving an overall balance.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What is geothermal energy?",
    options: [
      "A) Energy from burning natural gas underground",
      "B) Energy captured from ocean tides",
      "C) Solar energy stored in underground panels",
      "D) Energy generated from heat within the Earth's core",
    ],
    correct: 3,
    explanation: "Geothermal energy harnesses heat from inside the Earth to generate electricity or heat buildings.",
    mode: 'sustainability', reward: 130000, penalty: 110000,
  },
  {
    question: "What is 'greenwashing'?",
    options: [
      "A) Cleaning industrial waste with eco-friendly chemicals",
      "B) Making misleading environmental claims to appear more sustainable",
      "C) A government programme funding green infrastructure",
      "D) Painting buildings with eco-certified paint",
    ],
    correct: 1,
    explanation: "Greenwashing is when companies mislead consumers about their environmental practices.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What are the three Rs of sustainability?",
    options: [
      "A) Restore, Rebuild, Replant",
      "B) Reduce, Reuse, Recycle",
      "C) Renew, Rethink, Reform",
      "D) React, Respond, Recover",
    ],
    correct: 1,
    explanation: "The 3 Rs – Reduce, Reuse, Recycle – are the foundation of sustainable waste management.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What is a 'green bond'?",
    options: [
      "A) A savings account with interest tied to green energy prices",
      "B) A government tax credit for planting trees",
      "C) A financial instrument whose proceeds fund only environmentally beneficial projects",
      "D) A bond issued by companies in the agriculture sector",
    ],
    correct: 2,
    explanation: "Green bonds are debt instruments whose proceeds finance only environmentally beneficial projects.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What is the single largest source of global greenhouse gas emissions?",
    options: [
      "A) Agriculture and deforestation",
      "B) Industrial manufacturing",
      "C) Burning fossil fuels (coal, oil, gas)",
      "D) Ocean evaporation",
    ],
    correct: 2,
    explanation: "Burning coal, oil, and gas for energy is the largest source of greenhouse gas emissions globally.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What does 'biodiversity' refer to?",
    options: [
      "A) The diversity of renewable energy sources",
      "B) The variety of all living organisms on Earth and the ecosystems they form",
      "C) Genetic modification of crop species",
      "D) The number of species in a single ecosystem",
    ],
    correct: 1,
    explanation: "Biodiversity refers to the variety of all living things on Earth and the ecosystems they form.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What is a 'carbon offset'?",
    options: [
      "A) A tax exemption for low-carbon businesses",
      "B) A mechanism compensating CO2 emissions by funding emission-reduction projects elsewhere",
      "C) A device measuring carbon dioxide levels",
      "D) A penalty for exceeding carbon emission limits",
    ],
    correct: 1,
    explanation: "Carbon offsets fund projects like tree planting or renewable energy to balance your emissions.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What are the UN's SDGs?",
    options: [
      "A) Standard Development Guidelines for banking",
      "B) Sustainable Development Goals — 17 goals for a better world by 2030",
      "C) Scientific Data Groups for climate research",
      "D) Special Drawing Rights in international trade",
    ],
    correct: 1,
    explanation: "The 17 SDGs (Sustainable Development Goals) are the UN's blueprint for global prosperity by 2030.",
    mode: 'sustainability', reward: 140000, penalty: 120000,
  },
  {
    question: "What potent greenhouse gas is produced by rotting food in landfills?",
    options: [
      "A) Carbon dioxide (CO2)",
      "B) Nitrous oxide (N2O)",
      "C) Methane (CH4)",
      "D) Ozone (O3)",
    ],
    correct: 2,
    explanation: "Food waste in landfills produces methane — a greenhouse gas 80x more potent than CO2 short-term.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "Which industry is known for massive water use, pollution, and textile waste?",
    options: [
      "A) Fast fashion",
      "B) Organic farming",
      "C) Renewable energy",
      "D) Digital technology",
    ],
    correct: 0,
    explanation: "Fast fashion is a major polluter — high water use and huge volumes of textile waste.",
    mode: 'sustainability', reward: 130000, penalty: 110000,
  },
  {
    question: "Which gas is the primary driver of human-caused climate change?",
    options: [
      "A) Oxygen (O2)",
      "B) Nitrogen (N2)",
      "C) Carbon dioxide (CO2)",
      "D) Hydrogen (H2)",
    ],
    correct: 2,
    explanation: "CO2 from burning fossil fuels is the primary driver of human-caused climate change.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What does an 'ecological footprint' measure?",
    options: [
      "A) The physical size of a factory's land use",
      "B) Carbon emissions from a single product",
      "C) The number of animals affected by pollution",
      "D) How much productive land and sea is needed to sustain a lifestyle",
    ],
    correct: 3,
    explanation: "The ecological footprint measures how much productive land/sea is needed to sustain a lifestyle.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What is wind energy?",
    options: [
      "A) Energy from burning compressed air",
      "B) Energy from converting the kinetic energy of wind using turbines",
      "C) Energy stored in underground wind chambers",
      "D) Solar energy enhanced by wind cooling",
    ],
    correct: 1,
    explanation: "Wind turbines convert the kinetic energy of wind into electrical energy.",
    mode: 'sustainability', reward: 120000, penalty: 100000,
  },
  {
    question: "What is the 'zero-waste' lifestyle?",
    options: [
      "A) Spending zero money on non-essential goods",
      "B) Producing only recyclable goods in manufacturing",
      "C) A lifestyle aiming to send zero products to landfill",
      "D) Using zero electricity from fossil fuel sources",
    ],
    correct: 2,
    explanation: "Zero-waste aims to minimize waste sent to landfills by redesigning how we use resources.",
    mode: 'sustainability', reward: 130000, penalty: 110000,
  },
  {
    question: "What happens to ocean pH when oceans absorb excess CO2?",
    options: [
      "A) pH increases (becomes more alkaline)",
      "B) pH stays the same",
      "C) pH fluctuates unpredictably",
      "D) pH decreases (ocean acidification)",
    ],
    correct: 3,
    explanation: "Oceans absorb CO2, forming carbonic acid, lowering pH and threatening coral reefs.",
    mode: 'sustainability', reward: 140000, penalty: 120000,
  },
  {
    question: "What is biomass energy?",
    options: [
      "A) Energy from splitting atoms in organic matter",
      "B) Energy produced from organic materials like wood, crops, and agricultural waste",
      "C) Energy captured from ocean biological organisms",
      "D) Solar energy converted by plant cells",
    ],
    correct: 1,
    explanation: "Biomass energy comes from burning or converting organic materials like plants and agricultural waste.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What is hydropower?",
    options: [
      "A) Energy from converting water molecules chemically",
      "B) Power generated from filtering seawater",
      "C) Electricity generated by harnessing the power of flowing or falling water",
      "D) Energy from steam produced by geothermal water",
    ],
    correct: 2,
    explanation: "Hydropower generates electricity by harnessing the energy of flowing or falling water through turbines.",
    mode: 'sustainability', reward: 120000, penalty: 100000,
  },
  {
    question: "What is 'sustainable development'?",
    options: [
      "A) Development that uses only sustainable materials",
      "B) Building only in designated green zones",
      "C) Economic growth with no carbon emissions",
      "D) Development that meets present needs without compromising future generations",
    ],
    correct: 3,
    explanation: "Sustainable development (Brundtland, 1987) balances economic, social, and environmental needs.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What does SDG Goal 12 promote?",
    options: [
      "A) Responsible consumption and production",
      "B) Clean water and sanitation",
      "C) Quality education for all",
      "D) Gender equality",
    ],
    correct: 0,
    explanation: "SDG 12 — Responsible Consumption and Production — promotes sustainable resource use choices.",
    mode: 'sustainability', reward: 130000, penalty: 110000,
  },
  {
    question: "What is solar energy?",
    options: [
      "A) Energy from the heat of the Earth's core",
      "B) Energy from the radiation of the sun via photovoltaic panels",
      "C) Energy from burning hydrogen gas",
      "D) Energy captured from moonlight reflection",
    ],
    correct: 1,
    explanation: "Solar energy converts solar radiation into electricity through photovoltaic panels.",
    mode: 'sustainability', reward: 120000, penalty: 100000,
  },
  {
    question: "What percentage of global emissions comes from food waste?",
    options: [
      "A) Less than 1%",
      "B) About 8–10%",
      "C) Around 25%",
      "D) Over 40%",
    ],
    correct: 1,
    explanation: "Food waste contributes about 8–10% of global greenhouse gas emissions via landfill methane.",
    mode: 'sustainability', reward: 140000, penalty: 120000,
  },
  {
    question: "What is an electric vehicle (EV)?",
    options: [
      "A) A vehicle powered by a hybrid petrol-electric engine",
      "B) A vehicle with zero direct exhaust emissions powered by electricity",
      "C) Any vehicle using rechargeable batteries for auxiliary systems",
      "D) A vehicle that generates its own electricity from solar panels",
    ],
    correct: 1,
    explanation: "EVs have no direct exhaust emissions and can run on renewable energy, cutting carbon footprints.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What is ESG investing?",
    options: [
      "A) An investment approach considering ethical, environmental, and social criteria",
      "B) A strategy focused only on energy sector stocks",
      "C) A government-mandated pension fund structure",
      "D) Investing exclusively in startups",
    ],
    correct: 0,
    explanation: "ESG investing weighs Environmental, Social and Governance factors alongside financial performance.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "Approximately how many billion tons of CO2 do forests absorb per year globally?",
    options: [
      "A) 0.5 billion tons",
      "B) 2.6 billion tons",
      "C) 10 billion tons",
      "D) 50 billion tons",
    ],
    correct: 1,
    explanation: "Forests are vital carbon sinks — they absorb roughly 2.6 billion tons of CO2 per year globally.",
    mode: 'sustainability', reward: 140000, penalty: 130000,
  },
  {
    question: "What does 'energy efficiency' mean?",
    options: [
      "A) Using renewable energy for all electrical needs",
      "B) Producing energy with zero waste",
      "C) Using less energy to achieve the same output or result",
      "D) Switching to nuclear power for national grids",
    ],
    correct: 2,
    explanation: "Energy efficiency means doing more with less — LEDs, insulation, efficient appliances, etc.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What is a 'microplastic'?",
    options: [
      "A) A tiny piece of plastic less than 5mm long",
      "B) A plastic used only in high-tech microscopes",
      "C) A type of highly recyclable bioplastic",
      "D) A biodegradable alternative to plastic bags",
    ],
    correct: 0,
    explanation: "Microplastics are tiny plastic particles that pollute the environment and enter the food chain.",
    mode: 'sustainability', reward: 120000, penalty: 100000,
  },
  {
    question: "What is 'permaculture'?",
    options: [
      "A) A permanent culture of industrial manufacturing",
      "B) A design system for sustainable living and agriculture",
      "C) A type of heavy machinery used in green construction",
      "D) The practice of using chemical fertilizers exclusively",
    ],
    correct: 1,
    explanation: "Permaculture focuses on working with nature to create sustainable, self-sufficient ecosystems.",
    mode: 'sustainability', reward: 130000, penalty: 110000,
  },
  {
    question: "Which of these is the most energy-efficient way to travel long distances?",
    options: [
      "A) Private jet",
      "B) Solo driving in an SUV",
      "C) High-speed train",
      "D) Traditional cruise ship",
    ],
    correct: 2,
    explanation: "Trains, especially electric high-speed ones, have a much lower carbon footprint per passenger than planes or cars.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What is the primary goal of the 'Great Green Wall' in Africa?",
    options: [
      "A) To build a massive border wall between countries",
      "B) To create a forest belt to stop desertification in the Sahel",
      "C) To install solar panels across the whole continent",
      "D) To protect rare wildlife from all human contact",
    ],
    correct: 1,
    explanation: "The Great Green Wall aims to restore 100 million hectares of degraded land in Africa.",
    mode: 'sustainability', reward: 140000, penalty: 130000,
  },
  {
    question: "What is 'e-waste'?",
    options: [
      "A) Waste generated from sending too many emails",
      "B) Discarded electronic devices like phones and laptops",
      "C) Energy wasted by leaving lights on at night",
      "D) A type of digital currency that has no value",
    ],
    correct: 1,
    explanation: "Electronic waste (e-waste) contains toxic materials and requires specialized recycling.",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "What is 'regenerative agriculture'?",
    options: [
      "A) Farming that uses only lab-grown seeds",
      "B) Farming practices that restore soil health and biodiversity",
      "C) Agriculture focused on generating maximum possible profit per day",
      "D) Growing crops without using any water at all",
    ],
    correct: 1,
    explanation: "Regenerative farming aims to improve the environment while producing food, especially by capturing carbon in soil.",
    mode: 'sustainability', reward: 135000, penalty: 110000,
  },
  {
    question: "What is the main benefit of composting?",
    options: [
      "A) It creates artificial plastic alternatives",
      "B) it reduces landfill waste and creates nutrient-rich fertilizer",
      "C) It generates large amounts of electricity",
      "D) It prevents all types of air pollution",
    ],
    correct: 1,
    explanation: "Composting turns organic waste into 'black gold' for plants while reducing methane from landfills.",
    mode: 'sustainability', reward: 120000, penalty: 100000,
  },
  {
    question: "What is 'upcycling'?",
    options: [
      "A) Pedaling a bicycle uphill to generate power",
      "B) Transforming waste materials into new products of higher quality",
      "C) Selling used goods at a very high price",
      "D) Upgrading your software to be more energy-efficient",
    ],
    correct: 1,
    explanation: "Upcycling adds value to waste by turning it into something beautiful or useful (e.g., pallet furniture).",
    mode: 'sustainability', reward: 125000, penalty: 100000,
  },
  {
    question: "Which diet generally has the lowest environmental impact?",
    options: [
      "A) High-meat diet",
      "B) Plant-based (vegan or vegetarian) diet",
      "C) Processed-food-only diet",
      "D) Imported-fruit-only diet",
    ],
    correct: 1,
    explanation: "Plant-based diets require significantly less land and water and produce fewer emissions than meat-heavy ones.",
    mode: 'sustainability', reward: 130000, penalty: 110000,
  },
  {
    question: "What is a 'LEED' certification?",
    options: [
      "A) A license to drive electric vehicles",
      "B) A global rating system for green building design and construction",
      "C) A tax for companies that use too much water",
      "D) A certification for sustainable clothing brands",
    ],
    correct: 1,
    explanation: "LEED (Leadership in Energy and Environmental Design) is the most widely used green building rating system.",
    mode: 'sustainability', reward: 140000, penalty: 130000,
  },
];

// ─────────────────────────────────────────────
//  LISTING CHALLENGES
// ─────────────────────────────────────────────
export const financeListings: ListingChallenge[] = [
  {
    prompt: "List 3 types of passive income",
    answers: ["Rental income", "Stock dividends", "Copyright royalties", "Savings interest", "Affiliate marketing"],
    required: 3, mode: 'finance', reward: 50000, penalty: 40000,
  },
  {
    prompt: "List 3 ways to save money",
    answers: ["Automated savings", "Cutting non-essential expenses", "Energy efficiency", "Meal prepping", "Using discounts"],
    required: 3, mode: 'finance', reward: 140000, penalty: 110000,
  },
  {
    prompt: "List 3 types of financial risks",
    answers: ["Market volatility", "Credit default risk", "Inflation risk", "Liquidity risk", "Operational risk"],
    required: 3, mode: 'finance', reward: 145000, penalty: 120000,
  },
  {
    prompt: "List 3 types of investment assets",
    answers: ["Common stocks", "Government bonds", "Physical gold", "Real estate", "ETFs", "Cryptocurrencies"],
    required: 3, mode: 'finance', reward: 145000, penalty: 120000,
  },
  {
    prompt: "List 3 types of bank accounts",
    answers: ["Savings account", "Checking/Current account", "Fixed Deposit", "Money Market account"],
    required: 3, mode: 'finance', reward: 135000, penalty: 110000,
  },
  {
    prompt: "List 3 ways to increase your income",
    answers: ["Skill upskilling", "Starting a side hustle", "Investing in assets", "Negotiating a raise"],
    required: 3, mode: 'finance', reward: 150000, penalty: 125000,
  },
];

export const sustainabilityListings: ListingChallenge[] = [
  {
    prompt: "List 3 renewable energy sources",
    answers: ["Solar power", "Wind energy", "Hydroelectric power", "Geothermal heat", "Biomass energy"],
    required: 3, mode: 'sustainability', reward: 150000, penalty: 125000,
  },
  {
    prompt: "List 3 ways to reduce your carbon footprint",
    answers: ["Reducing meat consumption", "Using public transport", "Installing solar panels", "Minimizing air travel"],
    required: 3, mode: 'sustainability', reward: 145000, penalty: 120000,
  },
  {
    prompt: "List 3 examples of a circular economy",
    answers: ["Product repair", "Textile recycling", "Upcycling furniture", "Shared tool libraries"],
    required: 3, mode: 'sustainability', reward: 140000, penalty: 115000,
  },
  {
    prompt: "List 3 types of pollution",
    answers: ["Air pollution", "Ocean plastic pollution", "Soil contamination", "Noise pollution", "Light pollution"],
    required: 3, mode: 'sustainability', reward: 140000, penalty: 115000,
  },
  {
    prompt: "List 3 endangered animal species",
    answers: ["Bengal Tiger", "Mountain Gorilla", "Giant Panda", "Black Rhino", "African Elephant"],
    required: 3, mode: 'sustainability', reward: 145000, penalty: 120000,
  },
  {
    prompt: "List 3 eco-friendly transport methods",
    answers: ["Cycling", "Electric vehicles (EVs)", "High-speed rail", "Walking", "Public transit"],
    required: 3, mode: 'sustainability', reward: 145000, penalty: 120000,
  },
];

// ─────────────────────────────────────────────
//  INCOME & EXPENSE EVENTS
// ─────────────────────────────────────────────
// Income: Fixed range [50k, 175k]
export const incomeEvents: IncomeEvent[] = [
  { title: "Salary",           description: "You received your monthly salary!",                     amount: 65000,  icon: "💼" },
  { title: "Freelance Gig",    description: "You completed a project for a client!",                 amount: 50000,  icon: "💻" },
  { title: "Dividends",        description: "Your stocks paid out a dividend!",                      amount: 85000,  icon: "📈" },
  { title: "Bonus",            description: "Your excellent performance was rewarded with a bonus!", amount: 120000, icon: "🎁" },
  { title: "Rent Income",      description: "Income from your rented apartment!",                    amount: 75000,  icon: "🏠" },
  { title: "Asset Sale",       description: "You sold a high-value asset at a profit!",              amount: 175000, icon: "🚗" },
  { title: "Savings Interest", description: "High-yield interest on your savings account!",          amount: 55000,  icon: "🏦" },
  { title: "Tax Refund",       description: "The tax office returned your overpaid taxes!",          amount: 90000,  icon: "📋" },
  { title: "Investment Gain",  description: "Your tech investments have grown!",                      amount: 140000, icon: "💰" },
  { title: "Online Income",    description: "Income from your digital business!",                    amount: 110000, icon: "🌐" },
];

// Expenses: Fixed range [50k, 75k]
export const expenseEvents: ExpenseEvent[] = [
  { title: "Luxury Car Repair",  description: "Expensive vehicle maintenance.",                      amount: 55000, icon: "🔧" },
  { title: "Medical Surgery",    description: "Unexpected medical procedure.",                       amount: 60000, icon: "🏥" },
  { title: "Legal Settlement",   description: "Cost of settling a legal dispute.",                   amount: 75000, icon: "⚖️" },
  { title: "Business Tax Audit", description: "Large tax settlement after audit.",                  amount: 70000, icon: "📋" },
  { title: "Home Renovation",    description: "Emergency structural repairs to your house.",          amount: 65000, icon: "🏠" },
  { title: "Tech Upgrade",       description: "Replacing all professional equipment.",                amount: 50000, icon: "💻" },
  { title: "Vacation Spree",     description: "You went overboard on a luxury holiday.",             amount: 55000, icon: "✈️" },
  { title: "Stock Crash",        description: "Lost money in a localized market crash.",              amount: 60000, icon: "📉" },
];

export const jailMessages = [
  { title: "Bad Investment!",  description: "You invested without research. Wait one turn to recover.", icon: "📉" },
  { title: "Tax Audit!",       description: "A tax inspection. Stay in place or pay a fine to leave.", icon: "🔍" },
  { title: "Fund Bankruptcy",  description: "The fund you invested in collapsed. Skip a turn.",        icon: "💔" },
  { title: "Poor Decisions!",  description: "A series of bad financial choices has stopped you.",      icon: "⛔" },
];

export const switchMessages = [
  { from: 'finance',        to: 'sustainability', message: "🌱 Switching to Sustainability! Your decisions affect the planet!", icon: "🔄" },
  { from: 'sustainability', to: 'finance',        message: "💼 Back to Financial Literacy! Use smart investing to fund a green future!", icon: "🔄" },
];

import type { Question } from '../types';
import javascript from './javascript';
import python from './python';
import generalcs from './generalcs';
import web from './web';
import gitcli from './gitcli';
import algorithms from './algorithms';
import bash from './bash';
import databases from './databases';

const allQuestions: Question[] = [
  ...javascript,
  ...python,
  ...generalcs,
  ...web,
  ...gitcli,
  ...algorithms,
  ...bash,
  ...databases,
];

export default allQuestions;

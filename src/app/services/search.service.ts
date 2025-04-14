import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchKeyword = new BehaviorSubject<string>('');
  currentKeyword = this.searchKeyword.asObservable();

  constructor() { }

  updateSearchKeyword(keyword: string) {
    this.searchKeyword.next(keyword);
  }
} 
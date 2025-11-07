import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gioithieu',
  standalone: false,
  templateUrl: './gioithieu.component.html',
  styleUrl: './gioithieu.component.scss'
})
export class GioithieuComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Only basic initialization, no event handling as per request
    document.title = "Giới Thiệu - PizZing pizza";
  }

}

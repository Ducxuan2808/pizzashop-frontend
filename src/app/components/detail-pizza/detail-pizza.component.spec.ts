import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailPizzaComponent } from './detail-pizza.component';

describe('DetailPizzaComponent', () => {
  let component: DetailPizzaComponent;
  let fixture: ComponentFixture<DetailPizzaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailPizzaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailPizzaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

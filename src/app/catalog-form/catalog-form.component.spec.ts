import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogFormComponent } from '@src/app/catalog-form/catalog-form.component';

describe('CatalogFormComponent', () => {
  let component: CatalogFormComponent;
  let fixture: ComponentFixture<CatalogFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CatalogFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CatalogFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
